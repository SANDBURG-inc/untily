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

### 2025-01-16
- **[리팩토링]** Cron 로직 Next.js 서버 내장 방식으로 변경
  - `node-cron` 패키지 추가
  - `lib/cron/` 모듈 분리
  - `instrumentation.ts`로 서버 시작 시 자동 초기화
  - 기존 API Route는 lib/cron 호출로 변경 (수동 트리거용 유지)
  - 외부 Cron 트리거 (Vercel, crontab) 불필요
