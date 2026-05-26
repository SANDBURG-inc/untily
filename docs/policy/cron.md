# Cron Job 정책

서버에서 주기적으로 실행되는 자동화 작업에 대한 문서입니다.

## 현재 구조

Next.js 서버 내장 방식으로 `instrumentation.ts` + `node-cron`을 사용합니다.

```
instrumentation.ts     # 서버 시작 시 Cron 초기화
lib/cron/
├── index.ts           # Cron 스케줄러 (node-cron)
├── reminders.ts       # 자동 리마인더 발송
└── status-transition.ts  # 문서함 상태 자동 전환
```

## Cron Jobs

### 1. 자동 리마인더 발송

| 항목 | 값 |
|------|-----|
| **스케줄** | `*/30 * * * *` (매 시간 0분, 30분) |
| **파일** | `lib/cron/reminders.ts` |
| **함수** | `processReminders()` |

**동작:**
1. 현재 시간을 30분 단위로 정규화 (예: 09:15 → 09:00)
2. `ReminderSchedule.sendTime`이 현재 시간과 일치하는 스케줄 조회
3. 발송 대상 날짜 계산 (마감일 - timeValue × timeUnit)
4. 오늘이 발송 대상 날짜면 미제출자에게 이메일 발송
5. `ReminderLog` 생성

**하위 호환성:**
- 09:00에만 기존 `DocumentBoxRemindType` 기반 발송 (마감 3일 전)
- `ReminderSchedule`이 없는 문서함 대상

### 2. 문서함 상태 자동 전환

| 항목 | 값 |
|------|-----|
| **스케줄** | `*/30 * * * *` (매 시간 0분, 30분) |
| **파일** | `lib/cron/status-transition.ts` |
| **함수** | `processStatusTransition()` |

**동작:**
1. `status: OPEN` && `endDate < now` 인 문서함 조회
2. 일괄 `CLOSED_EXPIRED`로 상태 변경

**전환 규칙:**
| 현재 상태 | 마감 후 | 변경 |
|----------|--------|------|
| `OPEN` | ✅ | → `CLOSED_EXPIRED` |
| `CLOSED` | - | 변경 없음 |
| `OPEN_SOMEONE` | - | 변경 없음 (마감 후 제출 허용) |
| `OPEN_RESUME` | - | 변경 없음 (마감 후 제출 허용) |

## 수동 트리거 (API)

기존 API 엔드포인트로 수동 실행 가능:

```bash
# 리마인더 발송
curl https://untily.kr/api/cron/reminders

# 상태 전환
curl https://untily.kr/api/cron/status-transition
```

## 로그

서버 시작 시:
```
[Instrumentation] Registering server-side initialization...
[Cron] Initializing cron jobs...
[Cron] Cron jobs scheduled successfully
```

30분마다:
```
[Cron] Running reminder job at 2025-01-16T09:00:00.000Z
[Auto-Reminder] Found 3 schedules for 09:00
[Cron] Reminder job completed in 1234ms: 15 emails sent
```

---

## 다중 인스턴스 중복 실행 방지 (PM2 cluster)

`ecosystem.config.js`는 `instances: 4`, `exec_mode: 'cluster'`. `instrumentation.ts`의 `register()`는 **프로세스마다 1회** 실행되므로, `setupCronJobs()`도 인스턴스마다 호출되어 cron이 **4벌** 등록된다. (`isInitialized` 플래그는 프로세스 내 중복만 막고, 프로세스 간 중복은 못 막는다.)

→ 결과: 매 tick마다 `processReminders()` / `processStatusTransition()`가 4중 실행. **모든 수신자에게 리마인더 이메일 4통**, `ReminderLog` box당 4행, `updateMany` 4중 실행. (2026-05-18 PM2 로그로 확정.)

### 해결: CronRun unique-row claim

4 인스턴스 모두 cron을 등록하되(이중화 유지), job 본체 진입 시 **DB 행 선점**으로 1벌만 실제 수행한다.

```
model CronRun {
  id        String   @id @default(cuid())
  jobName   String   // 'reminders' | 'status-transition' | 'deadline-notification'
  slot      String   // 스케줄 tick을 job 주기로 floor한 ISO 문자열
  claimedAt DateTime @default(now())
  @@unique([jobName, slot])
}
```

- `claimCronSlot(jobName, slotMs)` 헬퍼: `INSERT ... ON CONFLICT DO NOTHING`. 삽입 성공한 인스턴스만 `true` → job 수행. 나머지 3벌은 즉시 스킵.
- **slot 계산**: 현재 시각을 job 주기로 floor (`*/30` → 30분, `0 9` → 날짜). 4 인스턴스가 9ms 내 동시 발화하므로 30분 경계를 못 넘어 동일 slot 산출.
- **at-most-once**: claim을 작업 *전*에 잡는다. 승자가 크래시하면 그 tick은 유실 → 수동 `/api/cron/*`로 복구.
- **PgBouncer 안전**: Neon `-pooler`(transaction-mode PgBouncer)에서 세션 advisory lock은 깨진다. unique-row claim은 단일 트랜잭션이라 풀러 무관하게 동작.
- **보존**: 승자가 기회적으로 `claimedAt < now() - 7d` prune (저빈도·경량).
- **수동 트리거 예외**: `/api/cron/*` GET은 claim 래퍼를 **거치지 않는다**. 수동 = 의도적 복구/테스트이므로 항상 실행.

> ⚠️ B/C(동적 스케줄·lazy expiry)는 별도 결정. 보류 — D 적용 후 Neon 실측 청구서로 필요성 판단.
> ⚠️ Flagged ambiguity (B/C 착수 시 해소): "만료"가 두 의미로 쓰임 — (1) 영속 상태 `CLOSED_EXPIRED` (대시보드 상태머신 키), (2) auth의 실시간 판정 `status==='OPEN' && now>endDate`. status-transition cron은 (1)을 유지. 제출 차단은 (2)로 이미 안전.

---

## 마이그레이션 가이드

### 기존 설정 삭제

이제 외부 Cron 트리거가 불필요합니다.

#### 1. EC2 crontab 삭제

```bash
# 현재 crontab 확인
crontab -l

# 아래 라인이 있다면 삭제
# */30 * * * * curl -X GET https://untily.kr/api/cron/reminders
# */30 * * * * curl -X GET https://untily.kr/api/cron/status-transition

# crontab 편집
crontab -e
# 위 라인들 삭제 후 저장
```

#### 2. Vercel Cron 삭제 (해당 시)

`vercel.json`에서 crons 섹션 제거:
```json
{
  "crons": []  // 또는 전체 삭제
}
```

#### 3. API 엔드포인트 삭제 (선택)

수동 트리거가 불필요하면 API Route 삭제 가능:
```bash
rm -rf app/api/cron/
```

> **권장**: API 엔드포인트는 유지 (디버깅, 수동 테스트용)

---

## CHANGELOG

### 2026-05-18
- **[버그/최적화]** PM2 cluster 4배 중복 cron 실행 확정 (로그 증거).
  - 결정: `CronRun` unique-row claim 테이블로 디둡 (at-most-once, 4 인스턴스 등록 유지).
  - 수동 `/api/cron/*`는 claim 우회.
  - B(동적 스케줄)/C(lazy expiry)는 보류 — D 적용 후 Neon 실측으로 판단.
  - 상세: `docs/neon-compute-optimization.md`, `docs/adr/0001-cron-single-execution-row-claim.md`

### 2025-01-16
- **[리팩토링]** Cron 로직 Next.js 서버 내장 방식으로 변경
  - `node-cron` 패키지 추가
  - `lib/cron/` 모듈 분리
  - `instrumentation.ts`로 서버 시작 시 자동 초기화
  - 기존 API Route는 lib/cron 호출로 변경 (수동 트리거용 유지)
  - 외부 Cron 트리거 (Vercel, crontab) 불필요
