# Neon Auth 인증 시스템

Untily는 [Neon Auth](https://neon.com/docs/auth)를 사용하여 인증을 처리합니다.

> Neon Auth는 Better Auth 기반으로, Neon 데이터베이스와 통합된 인증 솔루션입니다.

## 목차

1. [빠른 시작](#빠른-시작)
2. [파일 구조](#파일-구조)
3. [환경 변수](#환경-변수)
4. [인증 플로우](#인증-플로우)
5. [서버 컴포넌트에서 인증](#서버-컴포넌트에서-인증)
6. [클라이언트 컴포넌트에서 인증](#클라이언트-컴포넌트에서-인증)
7. [API 라우트에서 인증](#api-라우트에서-인증)
8. [Account 페이지](#account-페이지)
9. [UserButton 컴포넌트](#userbutton-컴포넌트)
10. [제출자 인증 시스템](#제출자-인증-시스템)
11. [User 객체](#user-객체)
12. [핵심 파일 설명](#핵심-파일-설명)
13. [트러블슈팅](#트러블슈팅)
14. [참고 자료](#참고-자료)

---

## 빠른 시작

### 서버 컴포넌트에서 인증 체크 (가장 일반적)

```tsx
import { ensureAuthenticated } from '@/lib/auth';

export default async function ProtectedPage() {
  const user = await ensureAuthenticated();  // 미로그인시 /sign-in으로 리다이렉트
  return <div>안녕하세요, {user.name}님</div>;
}
```

### 클라이언트 컴포넌트에서 로그인/로그아웃

```tsx
'use client';
import { authClient } from '@/lib/auth/client';

// 로그인
await authClient.signIn.email({ email, password });

// 로그아웃
await authClient.signOut();
```

---

## 파일 구조

```
lib/
├── auth.ts                     # 서버 인증 유틸리티 (ensureAuthenticated, getSession)
└── auth/
    ├── client.ts               # 클라이언트 인증 클라이언트 (authClient)
    └── submitter-auth.ts       # 제출자 전용 인증 로직

app/
├── api/auth/[...path]/route.ts # Neon Auth API 핸들러 (catch-all)
├── sign-in/page.tsx            # 로그인 페이지 (커스텀)
├── sign-up/page.tsx            # 회원가입 페이지 (커스텀)
├── forgot-password/page.tsx    # 비밀번호 찾기 페이지
└── account/
    ├── layout.tsx              # Account 레이아웃
    └── [path]/page.tsx         # Account 페이지 (Neon AccountView 사용)

components/
├── auth/
│   ├── SignInForm.tsx          # 로그인 폼 컴포넌트
│   ├── SignUpForm.tsx          # 회원가입 폼 컴포넌트
│   └── ForgotPasswordForm.tsx  # 비밀번호 찾기 폼 컴포넌트
├── shared/
│   └── UserButton.tsx          # 공유 유저 버튼 (드롭다운 메뉴)
└── providers/
    └── AuthProvider.tsx        # 앱 전역 Auth Provider
```

---

## 환경 변수

`.env` 파일에 다음 환경 변수가 필요합니다:

```env
# 필수
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.xxx.aws.neon.tech/neondb/auth
DATABASE_URL=postgresql://...
```

### 환경 변수 확인 방법

Neon Auth URL은 Neon Console에서 확인할 수 있습니다:

1. [Neon Console](https://console.neon.tech) 접속
2. `Project → Branch → Auth → Configuration`

---

## 인증 플로우

### 일반 사용자 (문서함 생성자)

```
┌─────────────┐     ┌─────────────┐
│   로그인    │ ──▶ │  /dashboard │
└─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐
│  회원가입   │ ──▶ │  /dashboard │
└─────────────┘     └─────────────┘
```

### 제출자 (서류 제출)

```
┌──────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 제출 링크 클릭   │ ──▶ │  이메일 인증    │ ──▶ │  서류 업로드    │
└──────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │
         ▼                        ▼
    미인증 상태             이메일 불일치 처리
```

---

## 서버 컴포넌트에서 인증

### ensureAuthenticated()

**인증 필수** 페이지에서 사용합니다. 미인증 시 `/sign-in`으로 자동 리다이렉트됩니다.

```tsx
// app/dashboard/page.tsx
import { ensureAuthenticated } from '@/lib/auth';

export default async function DashboardPage() {
  const user = await ensureAuthenticated();

  return (
    <div>
      <h1>안녕하세요, {user.name}님</h1>
      <p>이메일: {user.email}</p>
    </div>
  );
}
```

### getSession()

**선택적 인증** 페이지에서 사용합니다. 리다이렉트하지 않고 세션 정보만 반환합니다.

```tsx
// app/page.tsx (랜딩 페이지)
import { getSession } from '@/lib/auth';

export default async function HomePage() {
  const { session, user } = await getSession();

  return (
    <div>
      {user ? (
        <p>환영합니다, {user.name}님</p>
      ) : (
        <a href="/sign-in">로그인</a>
      )}
    </div>
  );
}
```

---

## 클라이언트 컴포넌트에서 인증

### authClient 임포트

```tsx
'use client';
import { authClient } from '@/lib/auth/client';
```

### 이메일 로그인

```tsx
const handleLogin = async () => {
  const result = await authClient.signIn.email({
    email: 'user@example.com',
    password: 'password123',
  });

  if (result.error) {
    console.error(result.error.message);
    // 에러 처리
  } else {
    // 성공: 리다이렉트
    router.push('/dashboard');
  }
};
```

### 이메일 회원가입

```tsx
const handleSignUp = async () => {
  const result = await authClient.signUp.email({
    email: 'user@example.com',
    password: 'password123',
    name: '홍길동',  // 선택사항
  });

  if (result.error) {
    console.error(result.error.message);
  } else {
    router.push('/dashboard');
  }
};
```

### 소셜 로그인 (Google)

```tsx
const handleGoogleLogin = async () => {
  await authClient.signIn.social({
    provider: 'google',
    callbackURL: '/dashboard',  // 로그인 후 리다이렉트 URL
  });
};
```

### 로그아웃

```tsx
const handleLogout = async () => {
  await authClient.signOut();
  router.push('/');
};
```

### 비밀번호 재설정 요청

```tsx
const handleForgotPassword = async () => {
  const result = await authClient.forgetPassword.emailOtp({
    email: 'user@example.com',
  });

  if (result.error) {
    console.error(result.error.message);
  } else {
    // 이메일 전송 성공 메시지 표시
  }
};
```

---

## API 라우트에서 인증

### 기본 인증 체크

```tsx
// app/api/document-box/route.ts
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import { NextResponse } from 'next/server';

export async function GET() {
  const { user } = await neonAuth();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 인증된 사용자의 요청 처리
  return NextResponse.json({
    userId: user.id,
    email: user.email,
  });
}
```

### POST 요청에서 인증

```tsx
export async function POST(request: Request) {
  const { user } = await neonAuth();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();

  // 인증된 사용자로 데이터 생성
  const newItem = await prisma.item.create({
    data: {
      ...body,
      userId: user.id,  // 현재 사용자 ID 연결
    },
  });

  return NextResponse.json(newItem);
}
```

---

## Account 페이지

Neon Auth의 `AccountView` 컴포넌트를 사용하여 사용자 계정 관리 페이지를 제공합니다.

### 지원 경로

| 경로 | 설명 |
|------|------|
| `/account/settings` | 프로필 정보 관리 (이름, 이메일 등) |
| `/account/security` | 비밀번호 변경, 활성 세션 목록 |
| `/account/api-keys` | API 키 관리 |
| `/account/organizations` | 조직 관리 |

### 구현 코드

```tsx
// app/account/[path]/page.tsx
import { AccountView } from '@neondatabase/neon-js/auth/react/ui';
import { accountViewPaths } from '@neondatabase/neon-js/auth/react/ui/server';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

export default async function AccountPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;

  return (
    <main className="container mx-auto p-4 md:p-6">
      <AccountView path={path} />
    </main>
  );
}
```

### 레이아웃

```tsx
// app/account/layout.tsx
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white">
            <DashboardHeader />
            {children}
        </div>
    );
}
```

---

## UserButton 컴포넌트

공유 가능한 유저 버튼 컴포넌트로, 드롭다운 메뉴를 통해 사용자 정보와 계정 관련 기능을 제공합니다.

### 위치

```
components/shared/UserButton.tsx
```

### Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `hideWhenLoggedOut` | `boolean` | `false` | 비로그인 시 버튼을 숨길지 여부 |

### 기능

- **로그인 상태**: 프로필 이미지/아이콘, 드롭다운 메뉴 (이름, 이메일, 계정 설정, 로그아웃)
- **비로그인 상태**: 로그인 링크 표시 또는 숨김 (`hideWhenLoggedOut` 옵션)

### 사용 예시

```tsx
// 기본 사용 (비로그인 시 로그인 버튼 표시)
import { UserButton } from '@/components/shared/UserButton';

<header>
  <UserButton />
</header>
```

```tsx
// 비로그인 시 숨기기 (제출 페이지 등에서 사용)
<header>
  <UserButton hideWhenLoggedOut />
</header>
```

### 드롭다운 메뉴 구성

1. **사용자 정보**: 이름, 이메일
2. **계정 설정**: `/account/settings`로 이동
3. **로그아웃**: 로그아웃 후 홈으로 리다이렉트

### 사용 중인 컴포넌트

- `components/dashboard/DashboardHeader.tsx`
- `components/submit/SubmitHeader.tsx`

---

## 제출자 인증 시스템

제출자(서류를 제출하는 사람)는 별도의 인증 플로우를 거칩니다.

### 제출자 인증 흐름

1. **문서함 존재 여부 확인**
2. **문서함 만료 여부 확인**
3. **제출자 존재 여부 확인**
4. **Neon Auth 로그인 여부 확인**
5. **이메일 일치 여부 확인**
6. **userId 연결** (최초 로그인 시)

### validateSubmitterAuth() 사용법

```tsx
// app/submit/[documentBoxId]/[submitterId]/page.tsx
import { validateSubmitterAuth } from '@/lib/auth/submitter-auth';

export default async function SubmitPage({ params }) {
  const { documentBoxId, submitterId } = params;

  const result = await validateSubmitterAuth(documentBoxId, submitterId);

  switch (result.status) {
    case 'success':
      // 인증 성공: 서류 업로드 페이지 표시
      return <UploadForm submitter={result.submitter} />;

    case 'not_authenticated':
      // 로그인 필요
      return <LoginPrompt submitter={result.submitter} />;

    case 'email_mismatch':
      // 이메일 불일치
      return <EmailMismatchView user={result.user} submitter={result.submitter} />;

    case 'not_found':
      // 문서함 또는 제출자를 찾을 수 없음
      return redirect('/submit/not-found');

    case 'expired':
      // 문서함 마감 기한 초과
      return redirect('/submit/expired');
  }
}
```

### 인증 결과 타입

```typescript
type SubmitterAuthResult =
  | { status: 'success'; user: NeonAuthUser; submitter: SubmitterWithDocumentBox }
  | { status: 'not_authenticated'; submitter: SubmitterWithDocumentBox }
  | { status: 'email_mismatch'; user: NeonAuthUser; submitter: SubmitterWithDocumentBox }
  | { status: 'not_found' }
  | { status: 'expired'; documentBox: DocumentBox };
```

---

## User 객체

### AuthenticatedUser 타입

```typescript
interface AuthenticatedUser {
  id: string;           // 고유 사용자 ID
  email: string;        // 이메일 주소
  name: string;         // 사용자 이름
  image?: string | null; // 프로필 이미지 URL
  emailVerified: boolean; // 이메일 인증 여부
  createdAt: Date;      // 생성일
  updatedAt: Date;      // 수정일
}
```

### 사용 예시

```tsx
const user = await ensureAuthenticated();

// 프로필 정보 표시
<div>
  <img src={user.image || '/default-avatar.png'} alt={user.name} />
  <h2>{user.name}</h2>
  <p>{user.email}</p>
  {user.emailVerified && <span>✓ 인증됨</span>}
</div>
```

---

## 핵심 파일 설명

### lib/auth.ts

서버 사이드 인증 유틸리티입니다.

```typescript
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import { redirect } from 'next/navigation';

// 인증 필수 (미인증 시 리다이렉트)
export async function ensureAuthenticated(): Promise<AuthenticatedUser> {
  const { session, user } = await neonAuth();
  if (!session || !user) {
    redirect('/sign-in');
  }
  return user as AuthenticatedUser;
}

// 선택적 인증 (리다이렉트 없음)
export async function getSession() {
  const { session, user } = await neonAuth();
  return { session, user };
}
```

### lib/auth/client.ts

클라이언트 사이드 인증 클라이언트입니다.

```typescript
'use client';
import { createAuthClient } from '@neondatabase/neon-js/auth/next';

export const authClient = createAuthClient();
```

### app/api/auth/[...path]/route.ts

Neon Auth API 핸들러입니다. 모든 인증 요청을 Neon Auth로 프록시합니다.

```typescript
import { authApiHandler } from '@neondatabase/neon-js/auth/next';

export const { GET, POST } = authApiHandler();
```

### components/providers/AuthProvider.tsx

앱 전역 Auth Provider입니다. `app/layout.tsx`에서 사용됩니다.

```typescript
'use client';
import { NeonAuthUIProvider } from "@neondatabase/neon-js/auth/react/ui";
import { authClient } from "@/lib/auth/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <NeonAuthUIProvider authClient={authClient}>
      {children}
    </NeonAuthUIProvider>
  );
}
```

---

## 트러블슈팅

### 자주 발생하는 문제

#### 1. "Unauthorized" 에러가 발생합니다

**원인**: 세션이 만료되었거나 쿠키가 없습니다.

**해결**:
- 브라우저 쿠키를 확인하세요
- 다시 로그인하세요
- `NEON_AUTH_BASE_URL` 환경 변수가 올바른지 확인하세요

#### 2. 소셜 로그인 후 리다이렉트가 작동하지 않습니다

**원인**: `callbackURL`이 올바르게 설정되지 않았습니다.

**해결**:
```tsx
await authClient.signIn.social({
  provider: 'google',
  callbackURL: '/dashboard',  // 절대 경로 사용
});
```

#### 3. 서버 컴포넌트에서 `authClient`를 사용하려고 합니다

**원인**: `authClient`는 클라이언트 전용입니다.

**해결**:
- 서버 컴포넌트에서는 `neonAuth()` 또는 `ensureAuthenticated()` 사용
- 클라이언트 컴포넌트에서만 `authClient` 사용

#### 4. 제출자 이메일이 일치하지 않습니다

**원인**: 제출자가 다른 이메일로 로그인했습니다.

**해결**:
- `email_mismatch` 상태를 처리하여 올바른 계정으로 로그인하도록 안내
- 또는 로그아웃 후 올바른 계정으로 재로그인

### 디버깅 팁

```tsx
// 서버 컴포넌트에서 세션 확인
const { session, user } = await neonAuth();
console.log('Session:', session);
console.log('User:', user);

// 클라이언트에서 로그인 결과 확인
const result = await authClient.signIn.email({ email, password });
console.log('Login result:', result);
```

---

## 참고 자료

- [Neon Auth 공식 문서](https://neon.com/docs/auth)
- [Neon Auth Next.js 빠른 시작](https://neon.com/docs/auth/quick-start/nextjs)
- [Better Auth 문서](https://www.better-auth.com/) (Neon Auth 기반)
