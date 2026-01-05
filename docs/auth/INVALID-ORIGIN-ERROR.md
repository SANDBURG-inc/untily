# INVALID_ORIGIN 에러 해결 가이드

## 문제 상황

프로덕션 환경(`https://dev.untily.kr`)에서 Neon Auth API 호출 시 `INVALID_ORIGIN` 403 에러가 발생합니다.

### 에러 응답

```json
{
  "code": "INVALID_ORIGIN",
  "message": "Invalid origin"
}
```

### 영향받는 API

- `/api/auth/sign-out` (로그아웃)
- `/api/auth/sign-in/email` (이메일 로그인)
- `/api/auth/sign-up/email` (이메일 회원가입)

### 증상

- **최초 1회**: 캐시/쿠키를 지우면 정상 작동
- **이후 요청**: 모든 인증 API가 403 에러 반환

---

## 근본 원인

### 1. Better Auth의 CORS 검증

Neon Auth는 [Better Auth](https://www.better-auth.com/) 기반으로 구축되어 있으며, Better Auth는 **엄격한 CORS 검증**을 수행합니다.

참고: [Better Auth Issue #3743](https://github.com/better-auth/better-auth/issues/3743)

### 2. Next.js의 CORS 헤더 미설정

Next.js는 기본적으로 **same-origin policy**를 따릅니다. API 라우트에서 cross-origin 요청을 허용하려면 명시적으로 CORS 헤더를 설정해야 합니다.

### 3. 실제 요청 헤더 분석

프로덕션 환경에서 실패한 요청의 헤더:

```
Request URL: https://dev.untily.kr/api/auth/sign-out
Request Method: POST
Status Code: 403 Forbidden

Request Headers:
  origin: https://dev.untily.kr
  cookie: __Secure-neon-auth.session_token=...
  referer: https://dev.untily.kr/dashboard

Response Headers:
  access-control-allow-credentials: true
  access-control-allow-origin: https://dev.untily.kr
```

**문제점**:
- Response Headers에 CORS 헤더가 **있음**에도 불구하고 403 에러 발생
- Better Auth가 **서버 측에서 추가 검증**을 수행하고 있음
- Neon Console의 Trusted Origins 설정과 Next.js의 CORS 헤더 설정이 **모두 필요**

---

## 해결 방법

### 1단계: Neon Console에서 Trusted Origins 설정

1. [Neon Console](https://console.neon.tech) 로그인
2. 프로젝트 선택 → **Auth** 섹션
3. **Trusted Origins** 또는 **Allowed Origins** 설정 찾기
4. 다음 도메인 추가:
   ```
   http://localhost:3000
   https://www.untily.kr
   https://untily.kr
   https://dev.untily.kr
   ```

> [!IMPORTANT]
> - 프로토콜(`http://` vs `https://`)을 정확히 입력
> - Trailing slash(`/`) 없이 입력
> - 각 환경(로컬/개발/프로덕션)의 도메인을 모두 추가

### 2단계: Next.js Proxy에서 CORS 헤더 추가

Next.js 16에서는 `middleware.ts` 대신 `proxy.ts`를 사용합니다.

#### proxy.ts 수정

```typescript
import { NextRequest, NextResponse } from "next/server";
import { neonAuthMiddleware } from "@neondatabase/neon-js/auth/next";

const allowedOrigins = [
  'http://localhost:3000',
  'https://www.untily.kr',
  'https://untily.kr',
  'https://dev.untily.kr',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /api/auth/* 경로: CORS 헤더 추가
  if (pathname.startsWith('/api/auth/')) {
    const origin = request.headers.get('origin');
    const isAllowedOrigin = origin && allowedOrigins.includes(origin);

    // Preflight 요청 처리
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      
      if (isAllowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Max-Age', '86400');
      }
      
      return response;
    }


    // 실제 요청 처리 - CORS 헤더 추가 및 헤더 보정
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-forwarded-proto', 'https'); // 프로덕션 환경에서 HTTPS로 인식되도록 강제

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  }

  // ... 기존 인증 미들웨어 로직
}
```

#### 주요 변경사항

1. **allowedOrigins 목록 추가**: 허용할 도메인 명시
2. **Preflight 요청 처리**: OPTIONS 메서드 처리
3. **동적 Origin 검증**: 요청의 Origin 헤더를 검증하여 허용된 도메인만 CORS 허용
4. **Credentials 지원**: 쿠키 기반 인증을 위해 `Access-Control-Allow-Credentials: true` 설정
5. **헤더 보정**: `x-forwarded-proto: https`를 강제 설정하여 Neon Auth가 요청을 보안 연결로 인식하도록 함 (Origin 검증 시 중요)

---

## 왜 이 방법이 필요한가?

### Better Auth의 이중 검증

Better Auth는 보안을 위해 **두 단계 검증**을 수행합니다:

1. **서버 측 검증** (Neon Console의 Trusted Origins)
2. **클라이언트 측 검증** (Next.js의 CORS 헤더)

두 설정이 **모두 일치**해야 인증 요청이 성공합니다.

### 최초 1회만 성공하는 이유

- **최초 요청**: 브라우저가 Preflight 요청(OPTIONS)을 보내지 않고 직접 POST 요청
- **이후 요청**: 브라우저가 CORS 정책에 따라 Preflight 요청을 먼저 보냄
- **문제**: Preflight 요청에 대한 적절한 CORS 헤더가 없어서 실패

### Next.js 16의 proxy.ts

Next.js 16부터 `middleware.ts`가 deprecated되고 `proxy.ts`를 사용합니다:

```
⚠ The "middleware" file convention is deprecated. 
  Please use "proxy" instead.
```

---

## 검증 방법

### 1. 로컬 환경 테스트

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속:
1. 회원가입/로그인 테스트
2. 로그아웃 테스트
3. 개발자 도구 → Network 탭에서 `/api/auth/*` 요청 확인

### 2. 프로덕션 배포 후 테스트

배포 후 `https://dev.untily.kr` 또는 `https://www.untily.kr`에서:
1. 로그아웃 시도
2. 개발자 도구 → Network 탭에서 확인:
   - Request Headers의 `Origin`
   - Response Headers의 `Access-Control-Allow-Origin`
   - Status Code가 200인지 확인

### 3. 예상되는 정상 응답 헤더

```
Status Code: 200 OK

Response Headers:
  access-control-allow-credentials: true
  access-control-allow-origin: https://dev.untily.kr
  content-type: application/json
```

---

## 트러블슈팅

### 여전히 403 에러가 발생하는 경우

1. **Neon Console 설정 재확인**
   - Trusted Origins에 정확한 도메인이 추가되었는지 확인
   - Trailing slash 없이 입력했는지 확인

2. **브라우저 캐시 삭제**
   ```
   개발자 도구 → Application → Clear storage → Clear site data
   ```

3. **실제 Origin 헤더 확인**
   - 개발자 도구 → Network → 실패한 요청 클릭
   - Request Headers의 `Origin` 값 확인
   - `allowedOrigins` 배열에 정확히 일치하는 값이 있는지 확인

4. **서버 재시작**
   ```bash
   # 로컬
   npm run dev
   
   # 프로덕션 (PM2)
   pm2 restart all
   ```

### CORS 헤더가 보이지 않는 경우

`proxy.ts`의 `config.matcher`에 `/api/auth/:path*`가 포함되어 있는지 확인:

```typescript
export const config = {
  matcher: [
    "/api/auth/:path*",  // 이 줄이 있어야 함
    "/dashboard/:path*",
    "/submit/:path*",
  ],
};
```

---

## 관련 이슈

- [Better Auth Issue #3743](https://github.com/better-auth/better-auth/issues/3743): INVALID_ORIGIN 에러 관련 이슈
- [Next.js Middleware to Proxy Migration](https://nextjs.org/docs/messages/middleware-to-proxy): Next.js 16의 middleware → proxy 마이그레이션 가이드

---

## 요약

1. **Neon Console**에서 Trusted Origins 설정
2. **proxy.ts**에 CORS 헤더 로직 추가
3. **allowedOrigins** 배열에 모든 환경의 도메인 추가
4. **배포 후 검증**: 개발자 도구에서 CORS 헤더 확인

이 두 단계를 모두 완료해야 Better Auth의 CORS 검증을 통과할 수 있습니다.
