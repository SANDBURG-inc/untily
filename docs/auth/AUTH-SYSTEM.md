# 인증 시스템

Untily는 [Stack Auth](https://docs.stack-auth.com/)를 사용하여 인증을 처리합니다.

## 목차

- [인증 플로우](#인증-플로우)
- [파일 구조](#파일-구조)
- [사용 방법](#사용-방법)
- [Stack Auth 설정](#stack-auth-설정)

---

## 인증 플로우

```
┌─────────────┐     ┌─────────────┐
│   로그인    │ ──▶ │  /dashboard │
└─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐
│  회원가입   │ ──▶ │  /dashboard │
└─────────────┘     └─────────────┘
```

### 상세 플로우

1. **로그인 (`/sign-in`)**
   - Stack Auth 로그인 처리
   - 성공 시 `/dashboard`로 리다이렉트

2. **회원가입 (`/sign-up`)**
   - Stack Auth 회원가입 처리
   - 성공 시 `/dashboard`로 리다이렉트

3. **보호된 페이지 접근**
   - `ensureAuthenticated()`: 미로그인 시 `/sign-in`으로 리다이렉트

---

## 파일 구조

```
stack/
├── client.tsx          # Stack Auth 클라이언트 설정 (urls 포함)
└── server.tsx          # Stack Auth 서버 설정 (urls 포함)

lib/
└── auth.ts             # 인증 서버 함수

app/
├── sign-in/page.tsx    # 로그인 페이지
├── sign-up/page.tsx    # 회원가입 페이지
├── forgot-password/    # 비밀번호 찾기
└── handler/[...stack]/ # Stack Auth 핸들러
```

---

## 사용 방법

### 서버 컴포넌트에서 인증 체크

```tsx
import { ensureAuthenticated } from '@/lib/auth';

export default async function ProtectedPage() {
  // 로그인 여부 확인 (미로그인 시 /sign-in으로 리다이렉트)
  const user = await ensureAuthenticated();

  return (
    <div>
      <h1>안녕하세요, {user.displayName}님</h1>
    </div>
  );
}
```

### Stack Auth 훅 직접 사용

```tsx
'use client';
import { useUser, useStackApp } from '@stackframe/stack';

export default function MyComponent() {
  const user = useUser();        // 현재 사용자 정보
  const app = useStackApp();     // Stack App 인스턴스

  const handleSignOut = async () => {
    await app.signOut();
  };

  return (
    <div>
      {user ? (
        <>
          <p>{user.primaryEmail}</p>
          <button onClick={handleSignOut}>로그아웃</button>
        </>
      ) : (
        <p>로그인이 필요합니다</p>
      )}
    </div>
  );
}
```

---

## Stack Auth 설정

### stack/client.tsx

```tsx
import { StackClientApp } from "@stackframe/stack";

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    afterSignIn: '/dashboard',
    afterSignUp: '/dashboard',
  }
});
```

### stack/server.tsx

```tsx
import { StackServerApp } from "@stackframe/stack";
import { stackClientApp } from "./client";

export const stackServerApp = new StackServerApp({
  inheritsFrom: stackClientApp,
  urls: {
    afterSignIn: '/dashboard',
    afterSignUp: '/dashboard',
  }
});
```

### lib/auth.ts

```tsx
import { stackServerApp } from '@/stack/server';
import { redirect } from 'next/navigation';

export async function ensureAuthenticated() {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect('/sign-in');
  }
  return user;
}
```

### 환경 변수

`.env.local` 파일에 Stack Auth 키 설정:

```env
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_client_key
STACK_SECRET_SERVER_KEY=your_server_key
```

---

## 참고 자료

- [Stack Auth 공식 문서](https://docs.stack-auth.com/)
- [Stack Auth Custom Pages](https://docs.stack-auth.com/customization/custom-pages)
