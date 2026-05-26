# NeonDB Compute 사용량 최적화 전략

> 작성일: 2026-05-18
> 대상: Untily 프로젝트 (Next.js + Prisma + NeonDB Postgres, EC2/PM2 배포)
> 목적: cron 으로 인한 NeonDB compute 사용량 분석 및 절감 전략 정리

---

## 0. 요약 (TL;DR)

- NeonDB 비용은 **compute "켜져 있던 시간"** 으로 매겨진다. 쿼리 개수가 아니다.
- 현재 `node-cron` 이 30분마다 DB를 깨워서 autosuspend(유휴 5분) 가 작동하지 못함 → cron 만으로 약 **4h/일 ≈ 120h/월** compute 점유.
- PM2 cluster(`instances: 4`) 때문에 cron 이 **인스턴스마다 1벌씩, 총 4벌** 실행됨 (로그로 확정). compute-h 는 동시 발화라 4배가 아니지만, **쿼리·커넥션 4배 + 중복 이메일 발송 잠복 버그** 존재.
- **최종 계획 (확정, 2026-05-18 grill-with-docs)**: **D만 적용 → Neon 실측 → B/C 후속 판단.**
  - **D (지금)**: `CronRun` unique-row claim 으로 cron 단일 실행. 4 인스턴스 등록·이중화 유지, claim 한 1벌만 수행. **중복 이메일 버그 제거 + 쿼리/커넥션 −75%.** (ADR-0001)
  - **C (보류)**: status-transition 폴링 제거(lazy expiry). 상태머신 14파일 관통 = 고위험. 실측 후 판단.
  - **B (보류)**: reminders 동적 스케줄(최대 −96%). saturation cap·B↔C 충돌 미해결. 실측 후 판단.
- 인프라 변경(Neon → EC2/RDS)은 비용만으로 결정하지 말 것. `cron.md`는 외부 트리거 폐지를 이미 결정. D 적용 후 실측 청구서로 판단.

---

## 1. 배경 — NeonDB 과금 모델

Neon 은 **Storage** 와 **Compute** 를 분리 과금한다.

- **Storage**: 데이터 디스크 용량. 항상 과금.
- **Compute**: Postgres 서버 프로세스. **최적화 대상.**

### scale-to-zero (autosuspend)

- 쿼리가 없으면 Postgres 프로세스를 완전히 정지 → compute 요금 0.
- 쿼리가 들어오면 resume (콜드 스타트 수백 ms).
- 마지막 쿼리 후 **유휴 타임아웃(기본 5분)** 동안 새 쿼리가 없으면 다시 정지.

> **요금 = Postgres 가 "켜져 있던 총 시간" (CU-hour).**
> 비유: 마지막 사용 후 5분 뒤 자동으로 꺼지는 전구. 1초만 써도 최소 5분치 요금.

이 "5분" 은 **Neon 콘솔 설정**이라 코드로 못 바꾼다. 코드로 줄일 수 있는 것은 **깨우는 횟수**뿐이다.

본 프로젝트는 **autosuspend ON** 으로 확인됨.

---

## 2. 현재 Cron 시스템

라이브러리: `node-cron` v4.2.1. 외부 스케줄러 없음. Next.js `instrumentation.ts` 에서 부팅 시 부트스트랩.

### 부트스트랩 흐름

```
instrumentation.ts (prod, 프로세스 부팅마다 1회)
  → setupCronJobs()  [lib/cron/index.ts]
      → node-cron 으로 3개 job 등록 (isInitialized 플래그로 프로세스 내 중복 방지)
```

### 3개 Job

| Job | 스케줄 | 빈도 | 핸들러 | 파일 |
|---|---|---|---|---|
| Reminders | `*/30 * * * *` | 30분마다 | `processReminders()` | `lib/cron/reminders.ts` |
| Status transition | `*/30 * * * *` | 30분마다 | `processStatusTransition()` | `lib/cron/status-transition.ts` |
| Deadline notification | `0 9 * * *` | 매일 09:00 | `processDeadlineNotifications()` | `lib/cron/deadline-notification.ts` |

- Reminders/Status 둘 다 `*/30` → 매시 :00, :30 동시 발화 → 하루 48 wake.
- Deadline 은 09:00 → :00 슬롯과 겹침. 추가 wake 없음.
- 수동 트리거: `GET /api/cron/{reminders|status-transition|deadline-notification}`, `Authorization: Bearer <CRON_SECRET>`.

### 핵심 동작 세부

- `ReminderSchedule.sendTime` = `String` `"HH:mm"`, 30분 단위로 정규화(`:00`/`:30`). (`schema.prisma:216`)
- legacy(`DocumentBoxRemindType`) 경로는 **09:00 에만** 실행.
- 배포: `ecosystem.config.js` PM2 cluster mode, `instances: 4` (t2.xlarge).

---

## 3. 비용 분석 (autosuspend ON 기준)

### Wake 모델

- 고유 wake = 하루 48회 (30분 간격). Deadline 09:00 겹침. PM2 4 instance 는 동시 발화 → wake 횟수 불변(쿼리만 4배).
- wake 1회당 active 시간 ≈ burst(수 초) + 유휴 5분 ≈ **5분**.
- 간격 30분 > 유휴 5분 → 매 wake 독립 정지, merge 안 됨.

### cron-only (무트래픽 구간)

```
48 wake/일 × 5분 = 240분 = 4.000 h/일
월: 30일 → 120.0h | 31일 → 124.0h | 평균 30.44일 → 121.8h (raw active hour)
cron 쿼리 가벼움 → 최소 0.25 CU 유지 → 121.8 × 0.25 ≈ 30.4 CU-h/월
```

### 사용자 트래픽 포함 공식

`U` = 하루 중 사용자 활동 연속 시간(시간).

```
일 active = U + (24 − U) / 6
월 active = 위 × 일수
```

| U (h/일) | active h/일 | 월(30일) raw h | CU-h @0.25 |
|---|---|---|---|
| 0 (cron만) | 4.00 | 120.0 | 30.0 |
| 9 (업무시간) | 11.50 | 345.0 | 86.3 |
| 12 | 14.00 | 420.0 | 105.0 |
| 24 (상시) | 24.00 | 720.0 | 180.0 |

> 정확 수치 좌우 변수: (1) autoscaling max CU (사용자 부하 spike 시 배수), (2) 실제 일 active h (Neon 콘솔 Monitoring → Compute 그래프로 실측).

---

## 4. 측정 결과 — PM2 4배 (확정)

### 증거 (PM2 로그, 2026-05-18 12:00:00 = 03:00:00 UTC 한 틱)

```
[Cron] Running status transition job at ...03:00:00.016Z
[Cron] Running status transition job at ...03:00:00.018Z
[Cron] Running status transition job at ...03:00:00.025Z
[Cron] Running status transition job at ...03:00:00.025Z
[Cron] Running reminder job at ...03:00:00.018Z
[Cron] Running reminder job at ...03:00:00.020Z
[Cron] Running reminder job at ...03:00:00.020Z
[Cron] Running reminder job at ...03:00:00.024Z
(각 completed 로그도 ×4)
```

9ms 안에 각 job 4벌 동시 실행 → **PM2 4 instance 가 각자 node-cron 등록** (`ecosystem instances: 4` + `instrumentation.register()` 가 프로세스마다 실행). 확정.

> 참고: `ReminderLog` 중복 측정 SQL 이 0행이었던 이유 = 당시 발송 대상 ReminderSchedule 없음(`0 emails sent`) → 로그 자체가 안 생성됨. 측정 정답 경로는 **PM2 로그**.

### 정량 임팩트

| 항목 | 현재(4벌) | D 적용(1벌) | 비고 |
|---|---|---|---|
| 쿼리/틱 | 8 (reminder×4 + status×4) | 2 | −75% |
| 쿼리/일 | 48틱 × 8 = 384 | 96 | 288 낭비/일 |
| 동시 커넥션/틱 | ~4 | ~1 | resume 시 커넥션 폭주 −75% |
| compute-h | 4배 아님 (동시 발화 = 단일 wake) | 동일 | — |
| 이메일 | 현재 0 (잠복) | 0 | ↓ 폭탄 제거 |

### ⚠ 잠복 버그

현재 `0 emails` 라 잠잠. **ReminderSchedule 활성 + 발송일 일치 순간 → 모든 수신자에게 이메일 4통**. + `ReminderLog` box당 4행(감사로그 오염·storage). status 만료 box 발생 시 `updateMany` 4중 실행. 운영 진입 시 즉시 발현. → **D 우선순위 최상**.

---

## 5. 최적화 전략

### A. cron 스케줄 단순 완화 — ❌ 기각

야간 컷(`*/30 7-22`)이나 간격 확대(`0 * * * *`)는 wake 를 줄이지만, `ReminderSchedule.sendTime` 이 **새벽 시각도 가능** → 새벽 리마인더 누락. **기능 깨짐. 채택 불가.**

### B. 동적 스케줄 (폴링 → 필요한 시각에만) — ⏸ 보류

> 보류 사유: 최대 −96% 절감 가능하나 saturation cap·B↔C 충돌 미해결. **D 적용 후 Neon 실측 청구서로 필요성 판단**(§8 Phase 2). 아래는 재착수 시 참고 설계.

**개념**: 30분 무조건 폴링(헛깨움 다수) 대신, DB에 실제 등록된 `sendTime` 들을 읽어 **그 시각에만** cron 등록.

**흐름 (의사코드)**:

```ts
async function registerReminderCrons() {
  const rows = await prisma.reminderSchedule.findMany({
    where: { isEnabled: true, channel: 'EMAIL' },
    select: { sendTime: true },
    distinct: ['sendTime'],
  });
  const times = new Set(rows.map(r => r.sendTime));
  times.add('09:00'); // legacy(DocumentBoxRemindType) 항상 필요

  for (const t of times) {
    const [hh, mm] = t.split(':');
    cron.schedule(`${mm} ${hh} * * *`, () => processReminders());
  }
}
```

**재등록 문제**: cron 목록을 부팅 시 DB 로 결정 → 런타임에 새 ReminderSchedule 추가되면 모름 → 누락.
- 해결(권장): `0 0 * * *` 매일 1회 목록 재조회·재등록. lag ≤24h 이나 첫 발송은 보통 마감 며칠 전이라 무해.
- 정밀 필요 시: ReminderSchedule create/update/delete API 에서 재등록 함수 호출 (코드 ↑).

**효과 (고유 sendTime 수 의존)**:

| 고유 sendTime 수 | wake/일 (+09:00+리로드) | 월 raw h | vs 120 |
|---|---|---|---|
| 1 (예: 다 09:00) | ~2 | 5 | −96% |
| 3 | ~4 | 10 | −92% |
| 8 | ~9 | 23 | −81% |
| 48 (전 슬롯 사용) | 48 | 120 | 0% (폴링과 동일) |

실측용 쿼리:

```sql
SELECT "sendTime", COUNT(*)
FROM "ReminderSchedule"
WHERE "isEnabled" = true AND channel = 'EMAIL'
GROUP BY "sendTime"
ORDER BY "sendTime";
```

### C. status-transition 폴링 제거 (B 와 세트 필수) — ⏸ 보류

> 보류 사유: 고위험. `CLOSED_EXPIRED` 는 단순 표시값 아니라 대시보드 상태머신 키(`documentBox-Status.md` §5.1/§5.2 — StatusChangeDropdown·"다시 열기"·"마감 후 발송" Dialog 분기). 순수 lazy = 14파일+상태전환 액션 관통. 또 B와 piggyback 시 tick 빈도 감소 → 만료 box DB상 OPEN 잔류 lag 증가(현재 30분 → 최악 ~19h)로 상태머신 퇴행. **D 적용 후 실측으로 정당성 확인 전엔 미착수.** 아래는 재착수 시 참고.

status 를 별도 30분 폴링으로 두면 그것만으로 48 wake → B 무효화. 둘 다 적용:

1. **lazy expiry (권장)**: 만료를 주기 검사하지 말고 **읽는 순간 판정**.

   ```ts
   function resolveStatus(box) {
     if (box.status === 'OPEN' && box.endDate < new Date()) {
       return 'CLOSED_EXPIRED';
     }
     return box.status;
   }
   ```

   조회·제출 차단 등 모든 지점에서 이 함수로 판정 → 백그라운드 폴링 불필요 → status 폴링 cron 삭제.

2. **piggyback (DB 일관성 보강)**: 리포트/통계처럼 컬럼 값이 실제로 `CLOSED_EXPIRED` 여야 하는 경우, reminders 가 깨우는 tick 에 status 일괄 update 도 같이 실행 (추가 wake 0, 공짜).

### D. cron 단일 실행 — CronRun unique-row claim (확정 설계)

> grill-with-docs 세션(2026-05-18)으로 확정. 상세 결정·기각안: `docs/adr/0001-cron-single-execution-row-claim.md`. 정책: `docs/policy/cron.md` "다중 인스턴스 중복 실행 방지".

PM2 cluster 4 프로세스 각자 `register()` 실행 → cron 4벌 → 이메일 4통/`ReminderLog` 4행/`updateMany` 4중 (로그로 확정된 운영 버그).

**확정 방식**: 4 인스턴스 모두 cron 등록 유지(이중화). job 본체 진입 시 DB 행 선점으로 1벌만 수행.

```prisma
model CronRun {
  id        String   @id @default(cuid())
  jobName   String
  slot      String
  claimedAt DateTime @default(now())
  @@unique([jobName, slot])
}
```

```ts
// lib/cron/claim.ts (신규)
export async function claimCronSlot(jobName: string, slotMs: number): Promise<boolean> {
  const slot = new Date(Math.floor(Date.now() / slotMs) * slotMs).toISOString();
  try {
    await prisma.cronRun.create({ data: { jobName, slot } });
    // 승자: 기회적 prune
    await prisma.cronRun.deleteMany({
      where: { claimedAt: { lt: new Date(Date.now() - 7 * 864e5) } },
    });
    return true;
  } catch (e) {
    if (isUniqueViolation(e)) return false; // 다른 인스턴스가 선점
    throw e;
  }
}
```

```ts
// lib/cron/index.ts — 각 콜백 래핑
cron.schedule('*/30 * * * *', async () => {
  if (!(await claimCronSlot('reminders', 30 * 60_000))) return;
  await processReminders();
});
```

**설계 근거 요약**:

| 항목 | 결정 | 이유 |
|---|---|---|
| 메커니즘 | DB row-claim (env 가드/세션 락 기각) | 이중화 유지, `NODE_APP_INSTANCE` 실측 의존 제거 |
| 풀러 안전 | 단일 트랜잭션 INSERT | Neon `-pooler`=transaction-mode PgBouncer → 세션 advisory lock 깨짐 |
| 의미론 | at-most-once (작업 전 claim) | 이메일 비멱등 → at-least-once는 중복 재유발. 유실 tick은 수동 복구 |
| slot 키 | 시각을 job 주기로 floor한 ISO | 4 인스턴스 9ms 내 동시발화 → 경계 못 넘어 동일 slot |
| 보존 | 승자가 7d prune | `CronRun` 무한 증가 차단 |
| 수동 API | claim 우회 | `/api/cron/*` = 의도적 복구, 항상 실행 |

**검증**: 임시 로그 "claimed/skipped" → 한 tick에 claimed 1 + skipped 3 확인. 기존 `[Cron] ... completed` 가 4줄 → 1줄로.

### E. reminders 루프 N+1 배치화 (부차)

`reminders.ts`: box 별 `findUnique(templateConfig)` + `create(reminderLog)` 루프 → `findMany` in-clause + `createMany` 1회. burst 단축. compute 절감은 작고 커넥션·지연 개선 위주.

### 효과 요약 (cron-only, 월 raw h)

| 단계 | 상태 | 월 raw h | 효과 |
|---|---|---|---|
| 현재 (유휴5분, 48 wake, 4벌) | — | 120 | 중복 이메일 버그, 쿼리 4배 |
| **+D (1벌)** | **✅ 확정·적용** | 120 | compute ~동일, **쿼리/커넥션 −75%, 중복 이메일 버그 제거** |
| +D+C (status 폴링 제거) | ⏸ 보류 | 120 (reminders 잔존) | compute 절감 없음(B 전제) |
| +D+C+B (sendTime 09:00 1개 가정) | ⏸ 보류 | ~5 | **−96%** (실측 후 판단) |

> D 자체는 compute-h 를 거의 안 줄인다(동시 발화 = 단일 wake). D 의 가치 = **버그 제거 + 쿼리/커넥션 −75%**. compute 절감은 B 영역이며 실측 후 결정.

---

## 6. 인프라 검토 — Neon vs EC2 / RDS

EC2 자체호스팅이 매력적인 이유 (이 워크로드 한정):

- t2.xlarge 이미 24/7 과금 중 → Postgres 얹으면 compute 추가비 ≈ $0.
- autosuspend 개념 소멸 → cron 깨움 비용 0. B/C/D 불필요.
- 같은 박스 = 네트워크 홉 제거 → 지연 ↓.

대가 (자체호스팅 세금):

| 항목 | Neon (관리형) | EC2 self-host |
|---|---|---|
| 백업/PITR | 자동 | 직접 구축·검증 |
| 패치/업그레이드 | 자동 | 직접, 다운타임 |
| HA/장애 | 관리형 복제 | 단일 노드 = SPOF, EBS 손실 = 데이터 손실 |
| 스케일 | 자동 | 수동, 다운타임 |
| 커넥션풀 | Neon pooler 내장 | PgBouncer 직접 |
| 운영 부담 | ~0 | 상시 |

추가 리스크: t2 = 버스트형(크레딧 소진 시 throttle). 한 박스에 Next 4 instance + Postgres → 메모리·IO 경합(noisy neighbor). 분리하면 "공짜" 전제 깨짐.

**권고** (최종 계획과 정렬):

1. **D 먼저 적용** (저위험, 버그 제거 — §8 Phase 1) → 1~2주 Neon 실측. D 는 compute 거의 안 줄이므로 실측치가 비용 판단 기준.
2. 실측이 plan 한도 내 → 종료. B/C·인프라 변경 모두 불필요.
3. 여전히 비쌈 → 먼저 **B/C 재검토**(코드, −96% 가능, 되돌리기 쉬움). self-host/RDS 마이그레이션은 그 다음.
4. self-host 는 운영세 상시 + 단일노드 리스크 = one-way door. 중간안 **RDS**: autosuspend 과금모델 없음(고정비), 백업 관리형, self-host 보다 운영 적음, Neon 보다 비쌈.
5. `cron.md` 는 외부 cron 트리거 폐지를 이미 결정 → EC2 crontab/Vercel 회귀는 문서화된 결정 역행. 인프라 변경은 self-host(DB만) 또는 RDS 한정 검토.

판단에 필요한 데이터: (1) 현재 Neon plan·실제 청구액 (2) 데이터 크기 (3) 운영 담당 인력 (4) 허용 데이터손실(RPO).

---

## 7. 측정 방법론

### PM2 4배 (확정 경로)

```bash
pm2 jlist                                  # instances, exec_mode, env 확인
pm2 describe <app>                          # 프로세스 수
pm2 logs --lines 5000 | grep "\[Cron\]"     # 같은 틱에 job 몇 벌 찍히나
```

같은 :00/:30 슬롯에 `Running ... job` 이 N줄 = N벌. `ecosystem.config.js` 의 `merge_logs: true` 때문에 모든 로그 prefix 가 `0|untily` 로 합쳐져 prefix 로는 인스턴스 식별 불가 → **중복 라인 수**로 4벌 확정함.

### D 적용 후 검증 (CronRun claim)

재배포 후 한 tick 관찰:

```bash
pm2 logs --lines 1000 | grep -E "claimed|skipped|\[Cron\].*completed"
```

- `claimed` 1줄 + `skipped` 3줄 (claim 헬퍼 임시 로그)
- `[Cron] ... completed` 4줄 → **1줄**
- Resend Logs: 동일 수신자 중복 발송 0
- 확인 후 임시 로그 제거

### ReminderLog 중복 (발송 데이터 있을 때만)

```sql
SELECT "documentBoxId",
       date_trunc('minute', "createdAt") AS minute,
       COUNT(*) AS dup
FROM "ReminderLog"
WHERE "createdAt" > now() - interval '7 days'
GROUP BY 1, 2
HAVING COUNT(*) > 1
ORDER BY minute DESC;
```

- 식별자(컬럼/테이블)는 **큰따옴표** `"createdAt"`, 값은 작은따옴표. 혼동 시 `date_trunc(unknown, unknown) is not unique` 발생.
- 0행이면: 최근 발송 없음(ReminderLog 미생성)일 수 있음 → `SELECT COUNT(*), MAX("createdAt") FROM "ReminderLog";` 로 데이터 유무 먼저 확인. 없으면 PM2 로그 경로 사용.

### Resend (사용자 피해)

대시보드 → Logs → 동일 수신자·제목이 발송 시각에 수 초 내 N건 → 중복 발송 N배.

### Neon 콘솔

- Monitoring → Compute: active time 그래프 (실제 일 active h), autosuspend 발생 여부.
- Monitoring → Connections: cron 시각 동시 커넥션 스파이크.
- Billing/Usage: 이번 달 CU-h, storage, 단위(raw-h vs CU-h) 확인.
- Settings → Compute: autoscaling min/max CU, suspend timeout.

---

## 8. 최종 계획 & 체크리스트

> 범위 확정(grill-with-docs, 2026-05-18): **D만 적용 → Neon 실측 → B/C 후속 판단.**
> 근거: D는 운영 버그(중복 이메일) 제거 + 쿼리 −75%, 저위험. B↔C 충돌·C 고위험(상태머신 14파일 관통)은 실측으로 정당성 확인 전엔 미착수.

### Phase 1 — D 적용 (지금)

1. **스키마**: `CronRun { jobName, slot, claimedAt } @@unique([jobName, slot])` 추가
   - [ ] `prisma/schema.prisma` 모델 추가
   - [ ] 마이그레이션 생성·적용 (`DIRECT_URL` 경유)
2. **claim 헬퍼**: `lib/cron/claim.ts`
   - [ ] `claimCronSlot(jobName, slotMs)` — `create` + unique 위반 시 `false`
   - [ ] 승자 7d prune
   - [ ] unique 위반 판별(`isUniqueViolation`) — Prisma `P2002`
3. **콜백 래핑**: `lib/cron/index.ts` 3개 콜백 앞에 `claimCronSlot` 가드 (slotMs: reminders/status=30분, deadline=24h)
   - [ ] `isInitialized` 유지, 4 인스턴스 등록 유지(이중화)
   - [ ] 임시 "claimed/skipped" 로그 추가
4. **수동 API 불변**: `/api/cron/*` 는 claim 미적용 확인(그대로 `processX` 직접 호출)
5. **검증**: 재배포 후 한 tick 관찰
   - [ ] `claimed` 1줄 + `skipped` 3줄
   - [ ] `[Cron] ... completed` 4줄 → 1줄
   - [ ] Resend 로그: 동일 수신자 중복 발송 0
   - [ ] 임시 로그 제거
6. **실측**: 1~2주 후 Neon Billing/Monitoring 으로 실제 compute-h·쿼리·커넥션 기록

### Phase 2 — B/C 판단 (실측 후, 조건부)

- 실측 비용이 plan 한도 내 → **종료** (B/C 불필요, 복잡도·위험 회피)
- 여전히 비쌈 → §9 미확정 항목 수집 후 B/C 재-grill
  - C: lazy expiry vs 전용 저빈도 status tick (상태머신 정합성 §documentBox-Status.md §5)
  - B: 동적 스케줄 + saturation cap(sendTime API 서버검증 추가) + 임계치 폴백
  - "만료" 용어 이중성 해소 → `CONTEXT.md` 생성

---

## 9. 미확정 / 확인 필요

**Phase 1 (D) — 검증 항목**
- [ ] 재배포 후 한 tick: claimed 1 + skipped 3, completed 4줄→1줄, Resend 중복 0
- [ ] Prisma unique 위반 코드 `P2002` 판별 정확성 (`isUniqueViolation`)

> ※ row-claim 채택으로 "PM2 `NODE_APP_INSTANCE` 주입 여부" 검증은 **불필요**해짐 (env 가드 기각, ADR-0001).

**Phase 2 (B/C 판단) — 실측 후 수집**
- [ ] 현재 Neon plan 및 이번 달 실제 청구액 (단위: raw-h vs CU-h)
- [ ] autoscaling max CU 설정값 (사용자 트래픽 비용 배수 결정)
- [ ] 실제 일 active h (`U`) — Neon Monitoring 그래프 실측
- [ ] 고유 `sendTime` 개수 (B 효과 확정)
- [ ] "만료" 용어 이중성 해소 → `CONTEXT.md` 생성

**인프라 결정용 (필요 시)**
- [ ] 데이터 크기 / RPO / 운영 인력
