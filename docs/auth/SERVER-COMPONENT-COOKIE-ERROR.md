# Server Component에서 쿠키 수정 불가 에러 해결

## 문제 상황

Next.js 15+ 버전에서 Server Component에서 직접 쿠키를 수정하려고 하면 다음과 같은 에러가 발생합니다:

```
Error: Cookies can only be modified in a Server Action or Route Handler.
```

### 발생 코드 예시

```tsx
// ❌ 에러 발생: Server Component에서 직접 쿠키 삭제
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const cookieStore = await cookies();
  const returnUrl = cookieStore.get('returnUrl')?.value;
  
  if (returnUrl) {
    cookieStore.delete('returnUrl');  // ❌ 에러!
    redirect(returnUrl);
  }
  
  return <div>홈페이지</div>;
}
```

---

## 왜 이런 에러가 발생하나요?

### Next.js의 렌더링 모델

Next.js 15부터는 **보안과 성능**을 위해 쿠키 수정을 엄격하게 제한합니다:

1. **Server Component**: 읽기 전용 (read-only)
   - `cookies().get()` ✅ 가능
   - `cookies().set()` ❌ 불가능
   - `cookies().delete()` ❌ 불가능

2. **Server Action**: 읽기/쓰기 가능 (read-write)
   - `cookies().get()` ✅ 가능
   - `cookies().set()` ✅ 가능
   - `cookies().delete()` ✅ 가능

3. **Route Handler**: 읽기/쓰기 가능 (read-write)
   - `cookies().get()` ✅ 가능
   - `cookies().set()` ✅ 가능
   - `cookies().delete()` ✅ 가능

### 왜 이렇게 제한하나요?

#### 1. 보안 (Security)

Server Component는 **서버에서 한 번만 렌더링**되고 결과가 클라이언트로 전송됩니다. 만약 Server Component에서 쿠키를 수정할 수 있다면:

- **CSRF 공격**에 취약해질 수 있음
- **예측 불가능한 부작용** 발생 가능
- **사용자 의도와 무관한 쿠키 변경** 위험

#### 2. 성능 (Performance)

Server Component는 **캐싱**될 수 있습니다. 쿠키 수정을 허용하면:

- **캐시 무효화** 로직이 복잡해짐
- **렌더링 성능 저하**
- **예측 불가능한 동작** 발생

#### 3. 명확성 (Clarity)

쿠키 수정을 **Server Action**으로 제한하면:

- **의도가 명확**해짐 (사용자 액션에 의한 변경)
- **디버깅이 쉬워짐**
- **코드 흐름을 추적**하기 쉬움

---

## 해결 방법

### 방법 1: Server Action 사용 (권장)

Server Action은 `'use server'` 지시어로 표시된 비동기 함수입니다.

#### 1단계: Server Action 생성

```typescript
// lib/auth/actions.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { RETURN_URL_COOKIE, isValidRedirectUrl } from './return-url';

/**
 * 쿠키에서 returnUrl을 삭제하고 해당 URL로 리다이렉트
 *
 * Server Action으로 구현 (쿠키 수정은 Server Action에서만 가능)
 */
export async function clearReturnUrlAndRedirect(returnUrl: string): Promise<never> {
  const cookieStore = await cookies();
  cookieStore.delete(RETURN_URL_COOKIE);

  // 보안: 유효한 상대 경로만 리다이렉트
  if (isValidRedirectUrl(returnUrl)) {
    redirect(returnUrl);
  }

  redirect('/dashboard');
}
```

**핵심 포인트**:
- `'use server'` 지시어로 Server Action 표시
- `cookies().delete()` 사용 가능 ✅
- `redirect()` 사용 가능 ✅

#### 2단계: 클라이언트 컴포넌트에서 호출

```tsx
// components/auth/ReturnUrlHandler.tsx
'use client';

import { useEffect, useRef } from 'react';
import { clearReturnUrlAndRedirect } from '@/lib/auth/actions';

interface ReturnUrlHandlerProps {
  returnUrl: string;
}

/**
 * OAuth 로그인 후 returnUrl 쿠키를 처리하는 클라이언트 컴포넌트
 *
 * 서버에서 로그인 상태와 returnUrl을 확인한 후,
 * 이 컴포넌트가 마운트되면 쿠키를 삭제하고 리다이렉트합니다.
 */
export default function ReturnUrlHandler({ returnUrl }: ReturnUrlHandlerProps) {
  const hasRedirected = useRef(false);

  useEffect(() => {
    // 중복 실행 방지
    if (hasRedirected.current) return;
    hasRedirected.current = true;

    // Server Action 호출: 쿠키 삭제 + 리다이렉트
    clearReturnUrlAndRedirect(returnUrl);
  }, [returnUrl]);

  // 리다이렉트 중 로딩 표시
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">리다이렉트 중...</p>
      </div>
    </div>
  );
}
```

**핵심 포인트**:
- `'use client'` 지시어로 클라이언트 컴포넌트 표시
- `useEffect`에서 Server Action 호출
- `useRef`로 중복 실행 방지

#### 3단계: Server Component에서 사용

```tsx
// app/page.tsx
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { getReturnUrlFromCookies } from "@/lib/auth/return-url";
import ReturnUrlHandler from "@/components/auth/ReturnUrlHandler";

export default async function Home() {
  const { user } = await getSession();
  const cookieStore = await cookies();
  const returnUrl = getReturnUrlFromCookies(cookieStore);

  // 로그인된 상태이고 returnUrl 쿠키가 있으면 클라이언트에서 리다이렉트 처리
  // (쿠키 수정은 Server Action에서만 가능하므로 클라이언트 컴포넌트 사용)
  if (user && returnUrl) {
    return <ReturnUrlHandler returnUrl={returnUrl} />;
  }

  return (
    <div>
      {/* 일반 홈페이지 콘텐츠 */}
    </div>
  );
}
```

**핵심 포인트**:
- Server Component에서는 쿠키 **읽기만** 수행 ✅
- 쿠키 **삭제는 클라이언트 컴포넌트**로 위임
- 클라이언트 컴포넌트가 **Server Action 호출**

---

## 흐름 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│ Server Component (app/page.tsx)                             │
│                                                               │
│ 1. cookies().get('returnUrl') ✅ 읽기만 가능                │
│ 2. returnUrl이 있으면 클라이언트 컴포넌트 렌더링           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Client Component (ReturnUrlHandler.tsx)                     │
│                                                               │
│ 3. useEffect에서 Server Action 호출                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Server Action (lib/auth/actions.ts)                         │
│                                                               │
│ 4. cookies().delete('returnUrl') ✅ 쿠키 삭제 가능          │
│ 5. redirect(returnUrl) ✅ 리다이렉트 가능                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Next.js 16에서 달라진 점

### Next.js 15 이전

```tsx
// ✅ 이전에는 가능했음
export default async function Page() {
  const cookieStore = cookies();
  cookieStore.set('key', 'value');  // 가능했음
  return <div>Page</div>;
}
```

### Next.js 15+

```tsx
// ❌ 더 이상 불가능
export default async function Page() {
  const cookieStore = await cookies();  // await 필요
  cookieStore.set('key', 'value');  // 에러!
  return <div>Page</div>;
}

// ✅ Server Action 사용 필요
'use server';
export async function setCookie() {
  const cookieStore = await cookies();
  cookieStore.set('key', 'value');  // 가능
}
```

**주요 변경사항**:
1. `cookies()`가 **Promise를 반환** (`await` 필요)
2. Server Component에서 쿠키 **수정 불가능**
3. **Server Action** 또는 **Route Handler**에서만 수정 가능

---

## 방법 2: Route Handler 사용

API 라우트를 만들어서 쿠키를 수정할 수도 있습니다.

```typescript
// app/api/clear-return-url/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('returnUrl');
  
  return NextResponse.json({ success: true });
}
```

```tsx
// 클라이언트에서 호출
'use client';

useEffect(() => {
  fetch('/api/clear-return-url', { method: 'POST' })
    .then(() => router.push(returnUrl));
}, []);
```

**단점**:
- 추가 HTTP 요청 필요
- Server Action보다 복잡
- 네트워크 오버헤드

---

## 베스트 프랙티스

### ✅ 권장사항

1. **Server Action 사용**: 쿠키 수정이 필요하면 Server Action 생성
2. **클라이언트 컴포넌트로 위임**: Server Component에서는 읽기만 하고, 수정은 클라이언트 컴포넌트로 위임
3. **보안 검증**: Server Action에서 입력값 검증 (예: `isValidRedirectUrl()`)
4. **중복 실행 방지**: `useRef`로 Server Action 중복 호출 방지

### ❌ 피해야 할 패턴

1. **Server Component에서 직접 쿠키 수정**: 에러 발생
2. **불필요한 Route Handler 생성**: Server Action으로 충분
3. **검증 없는 리다이렉트**: 보안 취약점

---

## 요약

| 구분 | 쿠키 읽기 | 쿠키 쓰기 | 사용 시점 |
|------|-----------|-----------|-----------|
| **Server Component** | ✅ 가능 | ❌ 불가능 | 페이지 렌더링 |
| **Client Component** | ❌ 불가능 | ❌ 불가능 | 인터랙션 처리 |
| **Server Action** | ✅ 가능 | ✅ 가능 | 사용자 액션 |
| **Route Handler** | ✅ 가능 | ✅ 가능 | API 엔드포인트 |

**핵심 원칙**:
- Server Component에서는 **읽기만**
- 쿠키 수정은 **Server Action** 또는 **Route Handler**에서만
- 클라이언트 컴포넌트는 **Server Action을 호출**하는 역할

---

## 참고 자료

- [Next.js Cookies Documentation](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
