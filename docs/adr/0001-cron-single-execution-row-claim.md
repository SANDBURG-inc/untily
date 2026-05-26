# Cron 단일 실행: CronRun unique-row claim

## Status

accepted (2026-05-18)

## Context

PM2 cluster(`instances: 4`)에서 `instrumentation.ts`의 `register()`가 프로세스마다 실행되어 cron이 4벌 등록된다. 매 tick마다 리마인더 이메일이 모든 수신자에게 4통 발송되고 `ReminderLog`/`updateMany`가 4중 실행된다 (2026-05-18 PM2 로그로 확정된 운영 버그).

## Decision

4 인스턴스 모두 cron을 등록하되, job 본체 진입 시 `CronRun { jobName, slot } @@unique([jobName, slot])` 테이블에 `INSERT ... ON CONFLICT DO NOTHING`으로 slot을 선점한 1벌만 실제 수행한다. claim은 작업 *전*에 잡는다(at-most-once). 수동 `/api/cron/*` 트리거는 claim을 거치지 않는다.

## Considered Options

- **instance-0 env 가드** (`NODE_APP_INSTANCE === '0'`): 가장 단순하나 cron 이중화를 잃는다. 인스턴스 0이 `max_memory_restart`로 재시작되는 tick은 영구 누락되며(리마인더는 `sendTime` 정확매칭이라 다음 tick이 메우지 않음), PM2가 해당 env를 주입하는지 서버 실측 의존이 남는다. 기각.
- **세션 advisory lock** (`pg_advisory_lock`): Neon `-pooler`는 transaction-mode PgBouncer라 세션 락이 백엔드 커넥션 재배정으로 깨진다. 기각.
- **lease + timeout 재-claim** (at-least-once): tick 유실은 없으나 이메일이 비멱등이라 재시도가 중복 발송을 재유발. 우리가 없애려는 버그를 되살리므로 기각.

## Consequences

- 이중화 유지: 임의 인스턴스가 죽어도 살아있는 인스턴스가 slot을 선점해 수행.
- at-most-once: 승자가 claim 직후 크래시하면 그 tick은 유실. 복구 경로 = 수동 `/api/cron/*`(claim 우회라 항상 실행).
- `CronRun`은 무한 증가 → 승자가 `claimedAt < now()-7d` 기회적 prune.
- 풀러 모드와 무관하게 동작(단일 트랜잭션 INSERT).
- B(동적 스케줄)/C(lazy expiry)는 본 결정과 독립. 보류 — D 적용 후 Neon 실측 청구서로 필요성 판단.
