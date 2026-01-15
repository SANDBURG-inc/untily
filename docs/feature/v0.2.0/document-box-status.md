# 문서함 상태 관리 기능

> v0.2.0 기능

## 개요

문서함(DocumentBox)에 명시적인 상태(status) 필드를 추가하여 제출 가능 여부를 제어합니다.
회원 탈퇴 시 해당 회원의 문서함을 자동으로 닫아 제출을 차단합니다.

## Phase 1 (현재)

### 상태 종류

| 상태 | 설명 | 제출 가능 |
|------|------|----------|
| `OPEN` | 기본값, 정상 운영 중 | O |
| `CLOSED` | 닫힌 상태 (탈퇴, 수동) | X |

### 스키마 변경

```prisma
enum DocumentBoxStatus {
  OPEN    // 제출 가능 (기본값)
  CLOSED  // 제출 불가
}

model DocumentBox {
  // ... 기존 필드
  status DocumentBoxStatus @default(OPEN)
}
```

### 주요 변경 사항

#### 1. 회원 탈퇴 시 문서함 닫기

**파일**: `app/api/user/delete/route.ts`

회원 탈퇴 시 해당 회원의 모든 문서함 `status`를 `CLOSED`로 변경합니다.

```typescript
await tx.documentBox.updateMany({
  where: { userId },
  data: {
    userId: `DELETED_USER_${timestamp}`,
    status: 'CLOSED',  // 추가됨
  },
});
```

#### 2. 인증 로직에서 상태 체크

**파일**: `lib/auth/public-submit-auth.ts`, `lib/auth/submitter-auth.ts`

문서함 조회 후 `status`가 `OPEN`이 아니면 `closed` 상태를 반환합니다.

```typescript
if (documentBox.status !== 'OPEN') {
  return { status: 'closed', documentBox };
}
```

#### 3. 리다이렉트 처리

**파일**: `lib/auth/submit-redirect.ts`

`closed` 상태인 경우 `/submit/closed` 페이지로 리다이렉트합니다.

```typescript
if (result.status === 'closed') {
  redirect(`/submit/closed?title=${encodeURIComponent(result.documentBox.boxTitle)}`);
}
```

#### 4. 안내 페이지

**파일**: `app/submit/closed/page.tsx`

닫힌 문서함 접근 시 표시되는 안내 페이지입니다.

### 타입 정의

**파일**: `lib/types/document.ts`

```typescript
import { DocumentBoxStatus } from '@/lib/generated/prisma/client';

export { DocumentBoxStatus };

export const DOCUMENT_BOX_STATUS_LABELS: Record<DocumentBoxStatus, string> = {
  OPEN: '제출 가능',
  CLOSED: '제출 마감',
};

export function isDocumentBoxOpen(status: DocumentBoxStatus): boolean {
  return status === 'OPEN';
}
```

### 후방호환성

- 기존 문서함은 `@default(OPEN)` 설정으로 자동으로 `OPEN` 상태가 됩니다.
- 추가 마이그레이션 없이 기존 데이터와 호환됩니다.

---

## Phase 2 (향후 계획)

### 추가 상태

| 상태 | 설명 |
|------|------|
| `OPEN_EXPIRED` | 마감 후 제한적 오픈 (마감 후 리마인드 수신자만 제출 가능) |
| `CLOSED_EXPIRED` | 마감 후 기본값 |
| `OPEN_RESUME` | 마감 후 관리자가 다시 열어준 상태 |

### 추가 기능

- 문서함 설정에 "마감 후 제출 허용" 옵션
- 만료일 도래 시 자동 상태 전환 (OPEN → CLOSED_EXPIRED)
- ReminderLog에 `sentAfterDeadline` 플래그 추가
- 마감 후 리마인드 수신자만 제출 허용 로직

---

## 관련 파일

```
prisma/schema.prisma              # 스키마 정의
lib/types/document.ts             # 타입 및 레이블
lib/auth/public-submit-auth.ts    # 공개 제출 인증
lib/auth/submitter-auth.ts        # 지정 제출 인증
lib/auth/submit-redirect.ts       # 리다이렉트 헬퍼
app/api/user/delete/route.ts      # 회원 탈퇴 API
app/submit/closed/page.tsx        # 닫힌 문서함 안내 페이지
```
