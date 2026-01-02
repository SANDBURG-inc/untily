# 제출자 인증 시스템 가이드

이 문서는 서류 제출자(Submitter)를 위한 인증 시스템을 설명합니다.

## 개요

제출자는 문서함 생성자(일반 사용자)와 다른 인증 플로우를 거칩니다. 제출자는 이메일 링크를 통해 접근하며, 해당 이메일로 로그인해야만 서류를 제출할 수 있습니다.

---

## 인증 플로우 다이어그램

```
                          ┌─────────────────────────┐
                          │   제출 링크 클릭        │
                          │ /submit/{boxId}/{subId} │
                          └───────────┬─────────────┘
                                      │
                                      ▼
                          ┌─────────────────────────┐
                          │  validateSubmitterAuth  │
                          └───────────┬─────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
      ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
      │  not_found    │       │   expired     │       │ 유효한 제출자  │
      └───────┬───────┘       └───────┬───────┘       └───────┬───────┘
              │                       │                       │
              ▼                       ▼                       │
       /submit/not-found       /submit/expired                │
                                                              ▼
                                              ┌───────────────────────────┐
                                              │     로그인 상태 확인       │
                                              └───────────────┬───────────┘
                                                              │
                                      ┌───────────────────────┼───────────────────────┐
                                      │                       │                       │
                                      ▼                       ▼                       ▼
                              ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
                              │not_authenticated│     │email_mismatch │       │   success     │
                              └───────┬───────┘       └───────┬───────┘       └───────┬───────┘
                                      │                       │                       │
                                      ▼                       ▼                       ▼
                               로그인 화면 표시          이메일 불일치 안내        서류 업로드 페이지
```

---

## 핵심 함수: validateSubmitterAuth

### 위치

```
lib/auth/submitter-auth.ts
```

### 함수 시그니처

```typescript
async function validateSubmitterAuth(
  documentBoxId: string,
  submitterId: string
): Promise<SubmitterAuthResult>
```

### 검증 순서

1. **문서함 존재 여부 확인** - 유효한 documentBoxId인지 확인
2. **문서함 만료 여부 확인** - endDate가 지났는지 확인
3. **제출자 존재 여부 확인** - 해당 문서함에 submitterId가 있는지 확인
4. **Neon Auth 로그인 여부 확인** - 현재 세션이 있는지 확인
5. **이메일 일치 여부 확인** - 로그인한 이메일과 제출자 이메일 비교
6. **userId 연결** - 최초 로그인 시 제출자와 사용자 ID 연결

---

## 반환 타입

### SubmitterAuthResult

```typescript
type SubmitterAuthResult =
  | { status: 'success'; user: NeonAuthUser; submitter: SubmitterWithDocumentBox }
  | { status: 'not_authenticated'; submitter: SubmitterWithDocumentBox }
  | { status: 'email_mismatch'; user: NeonAuthUser; submitter: SubmitterWithDocumentBox }
  | { status: 'not_found' }
  | { status: 'expired'; documentBox: DocumentBox };
```

### 각 상태별 설명

| 상태 | 설명 | 포함 데이터 |
|------|------|------------|
| `success` | 인증 성공, 서류 제출 가능 | user, submitter |
| `not_authenticated` | 로그인하지 않은 상태 | submitter |
| `email_mismatch` | 다른 이메일로 로그인됨 | user, submitter |
| `not_found` | 문서함 또는 제출자 없음 | - |
| `expired` | 문서함 마감 기한 초과 | documentBox |

---

## 사용 예시

### 기본 사용법

```tsx
// app/submit/[documentBoxId]/[submitterId]/page.tsx
import { validateSubmitterAuth } from '@/lib/auth/submitter-auth';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    documentBoxId: string;
    submitterId: string;
  }>;
}

export default async function SubmitPage({ params }: PageProps) {
  const { documentBoxId, submitterId } = await params;
  const result = await validateSubmitterAuth(documentBoxId, submitterId);

  switch (result.status) {
    case 'success':
      return <UploadForm submitter={result.submitter} user={result.user} />;

    case 'not_authenticated':
      return <SubmitLandingView submitter={result.submitter} />;

    case 'email_mismatch':
      return (
        <EmailMismatchView
          user={result.user}
          submitter={result.submitter}
        />
      );

    case 'not_found':
      redirect('/submit/not-found');

    case 'expired':
      redirect('/submit/expired');
  }
}
```

### 로그인 필요 화면 (not_authenticated)

제출자 정보를 보여주면서 로그인을 유도합니다.

```tsx
// components/submit/SubmitLandingView.tsx
'use client';

import { authClient } from '@/lib/auth/client';
import { SubmitterWithDocumentBox } from '@/lib/auth/submitter-auth';

interface Props {
  submitter: SubmitterWithDocumentBox;
}

export function SubmitLandingView({ submitter }: Props) {
  const handleLogin = async () => {
    // 현재 페이지로 돌아오도록 callbackURL 설정
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: window.location.pathname,
    });
  };

  return (
    <div>
      <h1>{submitter.documentBox.boxTitle}</h1>
      <p>안녕하세요, {submitter.name}님</p>
      <p>서류를 제출하려면 {submitter.email}로 로그인해주세요.</p>

      <button onClick={handleLogin}>
        Google로 로그인
      </button>
    </div>
  );
}
```

### 이메일 불일치 화면 (email_mismatch)

다른 계정으로 로그인되어 있을 때 안내합니다.

```tsx
// components/submit/EmailMismatchView.tsx
'use client';

import { authClient } from '@/lib/auth/client';
import { NeonAuthUser, SubmitterWithDocumentBox } from '@/lib/auth/submitter-auth';

interface Props {
  user: NeonAuthUser;
  submitter: SubmitterWithDocumentBox;
}

export function EmailMismatchView({ user, submitter }: Props) {
  const handleLogout = async () => {
    await authClient.signOut();
    window.location.reload();  // 로그아웃 후 페이지 새로고침
  };

  return (
    <div>
      <h2>다른 계정으로 로그인되어 있습니다</h2>

      <div>
        <p>현재 로그인: {user.email}</p>
        <p>필요한 이메일: {submitter.email}</p>
      </div>

      <p>
        {submitter.email}로 로그인해야 서류를 제출할 수 있습니다.
      </p>

      <button onClick={handleLogout}>
        로그아웃 후 다시 로그인
      </button>
    </div>
  );
}
```

---

## 관련 타입

### SubmitterWithDocumentBox

제출자와 관련 문서함 정보를 포함하는 타입입니다.

```typescript
type SubmitterWithDocumentBox = Submitter & {
  documentBox: DocumentBox & {
    requiredDocuments: RequiredDocument[];
  };
  submittedDocuments: SubmittedDocument[];
};
```

### NeonAuthUser

Neon Auth에서 반환하는 사용자 정보입니다.

```typescript
interface NeonAuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 헬퍼 함수

### markSubmitterAsSubmitted

제출 완료 후 상태를 업데이트합니다.

```typescript
import { markSubmitterAsSubmitted } from '@/lib/auth/submitter-auth';

// 모든 서류 업로드 완료 후
await markSubmitterAsSubmitted(submitterId);
```

### getSubmitterStatus

제출자의 현재 상태를 조회합니다.

```typescript
import { getSubmitterStatus } from '@/lib/auth/submitter-auth';

const status = await getSubmitterStatus(submitterId);
// { status: 'PENDING' | 'SUBMITTED', submittedAt: Date | null }
```

---

## 이메일 비교 로직

이메일 비교는 대소문자를 무시합니다.

```typescript
const userEmail = user.email?.toLowerCase();
const submitterEmail = submitter.email.toLowerCase();

if (userEmail !== submitterEmail) {
  return { status: 'email_mismatch', user, submitter };
}
```

---

## userId 자동 연결

제출자가 처음 로그인하면 자동으로 userId가 연결됩니다.

```typescript
if (!submitter.userId) {
  await prisma.submitter.update({
    where: { submitterId },
    data: { userId: user.id },
  });
}
```

이후 동일한 제출자가 다시 접근하면 이미 연결된 userId가 있어 추가 업데이트가 발생하지 않습니다.

---

## 에러 페이지

### /submit/not-found

문서함이나 제출자를 찾을 수 없을 때 리다이렉트됩니다.

```tsx
// app/submit/not-found/page.tsx
export default function NotFoundPage() {
  return (
    <div>
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>유효하지 않은 제출 링크입니다.</p>
    </div>
  );
}
```

### /submit/expired

문서함 마감 기한이 지났을 때 리다이렉트됩니다.

```tsx
// app/submit/expired/page.tsx
export default function ExpiredPage() {
  return (
    <div>
      <h1>제출 기한이 마감되었습니다</h1>
      <p>서류 제출 기한이 종료되었습니다.</p>
    </div>
  );
}
```

---

## 보안 고려사항

1. **이메일 검증**: 제출자는 반드시 등록된 이메일로 로그인해야 합니다
2. **문서함 소유권**: 제출자는 자신이 초대받은 문서함에만 접근할 수 있습니다
3. **만료 체크**: 마감된 문서함에는 제출할 수 없습니다
4. **대소문자 무시**: 이메일 비교 시 대소문자 차이로 인한 문제 방지

---

## 관련 문서

- [AUTH-SYSTEM.md](./AUTH-SYSTEM.md) - 전체 인증 시스템 개요
- [API-AUTH.md](./API-AUTH.md) - API 엔드포인트 인증 가이드
