# 로그인 후 원래 페이지 리다이렉트 가이드

> 이 문서는 OAuth 로그인 후 원래 접근하려던 페이지로 리다이렉트하는 기능에 대한 설명입니다.

## 목차

1. [문제 정의](#문제-정의)
2. [기초 지식](#기초-지식)
3. [해결 방안](#해결-방안)
4. [수정된 파일](#수정된-파일)
5. [동작 플로우](#동작-플로우)
6. [테스트 방법](#테스트-방법)
7. [Git Worktree 사용법](#git-worktree-사용법)

---

## 문제 정의

### 증상
- 사용자가 `/submit/[documentBoxId]` (서류 제출 링크)에 접속
- 로그인이 필요하여 로그인 페이지로 이동
- Google OAuth로 로그인 완료
- **문제**: 원래 페이지(`/submit/...`)가 아닌 홈(`/`)으로 이동

### 원인
Neon Auth의 `authClient.signIn.social({ callbackURL })`이 OAuth 콜백 후 `callbackURL`을 제대로 처리하지 않음. OAuth 플로우 중 `callbackURL` 상태가 손실됨.

---

## 기초 지식

### OAuth 인증 플로우
```
1. 사용자가 "Google로 로그인" 클릭
2. Google 인증 페이지로 리다이렉트
3. 사용자가 Google에서 인증
4. Google이 우리 앱의 콜백 URL로 리다이렉트
5. 앱에서 세션 생성 후 최종 목적지로 리다이렉트
```

### callbackURL vs returnUrl
- **callbackURL**: URL 쿼리 파라미터로 전달 (`/sign-in?callbackURL=/submit/abc`)
- **returnUrl**: 쿠키에 저장된 리다이렉트 URL

### 왜 쿠키를 사용하는가?
- OAuth 플로우는 외부 서비스(Google)를 경유
- URL 파라미터는 OAuth 과정에서 손실될 수 있음
- 쿠키는 브라우저에 저장되어 OAuth 완료 후에도 유지됨

### Next.js 서버 컴포넌트 vs 클라이언트 컴포넌트
```tsx
// 서버 컴포넌트 - 'use server' 또는 기본값
// cookies()로 쿠키 접근
import { cookies } from 'next/headers';
const cookieStore = await cookies();
const value = cookieStore.get('name');

// 클라이언트 컴포넌트 - 'use client'
// document.cookie로 쿠키 접근
document.cookie = 'name=value; path=/';
```

---

## 해결 방안

### 핵심 아이디어
OAuth 시작 전에 `returnUrl`을 쿠키에 저장하고, 로그인 완료 후 홈 페이지에서 쿠키를 확인하여 리다이렉트.

### 아키텍처
```
사용자 → /submit/abc123 접속
         │
         ▼
┌─────────────────────────────────┐
│  PublicSubmitLandingView        │
│  "로그인하고 제출하기" 버튼      │
│  → /sign-in?callbackURL=...     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  SignInForm (useEffect)         │
│  쿠키에 callbackURL 저장         │
│  → auth_return_url 쿠키 생성     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Google OAuth                   │
│  (Neon Auth 처리)               │
│  → 완료 후 / 로 리다이렉트       │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  홈 페이지 (app/page.tsx)       │
│  1. 로그인 상태 확인             │
│  2. 쿠키에서 returnUrl 읽기      │
│  3. 쿠키 삭제                   │
│  4. returnUrl로 리다이렉트       │
└─────────────────────────────────┘
         │
         ▼
    /submit/abc123/upload (원래 목적지)
```

---

## 수정된 파일

### 1. `/lib/auth/return-url.ts` (신규)

쿠키 기반 returnUrl 관리 유틸리티.

```typescript
// 주요 함수
setReturnUrlCookie(url)      // 클라이언트: 쿠키에 URL 저장
clearReturnUrlCookie()       // 클라이언트: 쿠키 삭제
getReturnUrlCookie()         // 클라이언트: 쿠키 읽기
getReturnUrlFromCookies()    // 서버: 쿠키 읽기
getRedirectUrl()             // 최종 리다이렉트 URL 결정
```

### 2. `/components/auth/SignInForm.tsx`

```typescript
// 추가된 로직
useEffect(() => {
  if (callbackURL) {
    setReturnUrlCookie(callbackURL); // 쿠키에 저장
  }
}, [callbackURL]);

// 이메일 로그인 성공 시
clearReturnUrlCookie(); // 쿠키 삭제
router.push(redirectUrl);
```

### 3. `/components/auth/SignUpForm.tsx`

SignInForm과 동일한 로직 적용.

### 4. `/app/page.tsx`

```typescript
export default async function Home() {
  const { user } = await getSession();
  const cookieStore = await cookies();
  const returnUrl = getReturnUrlFromCookies(cookieStore);

  // 로그인 상태 + 쿠키 있으면 리다이렉트
  if (user && returnUrl) {
    cookieStore.delete(RETURN_URL_COOKIE);
    redirect(returnUrl);
  }

  // 일반 홈 페이지 렌더링
  return <main>...</main>;
}
```

### 5. `/proxy.ts`

```typescript
// /dashboard 경로에도 callbackURL 추가
if (pathname.startsWith("/dashboard")) {
  const dashboardAuthMiddleware = neonAuthMiddleware({
    loginUrl: `/sign-in?callbackURL=${encodeURIComponent(pathname)}`,
  });
  return dashboardAuthMiddleware(request);
}
```

---

## 동작 플로우

### Before (문제 상황)
```
/submit/abc123 접속
  → "로그인하고 제출하기" 클릭
  → /sign-in?callbackURL=/submit/abc123/upload
  → Google OAuth 로그인
  → / (홈) ❌ 잘못된 동작
```

### After (수정 후)
```
/submit/abc123 접속
  → "로그인하고 제출하기" 클릭
  → /sign-in?callbackURL=/submit/abc123/upload
  → SignInForm에서 쿠키 저장 (auth_return_url=/submit/abc123/upload)
  → Google OAuth 로그인
  → / (홈)
  → 홈에서 쿠키 확인 + 로그인 상태 확인
  → /submit/abc123/upload로 리다이렉트 ✅
```

---

## 테스트 방법

### 사전 준비
```bash
# 1. 개발 서버 실행
pnpm dev

# 2. 브라우저 개발자 도구 열기 (F12)
# Application > Cookies 탭에서 쿠키 확인 가능
```

### 테스트 시나리오

#### 시나리오 1: 공개 제출 페이지 → Google OAuth
1. 로그아웃 상태 확인
2. `/submit/[documentBoxId]` 접속 (관리자가 생성한 링크)
3. 랜딩 페이지 표시 확인
4. "로그인하고 제출하기" 버튼 클릭
5. `/sign-in?callbackURL=...` 페이지로 이동 확인
6. **쿠키 확인**: `auth_return_url` 쿠키가 생성되었는지 확인
7. "Google로 계속하기" 클릭
8. Google 계정으로 로그인
9. **결과 확인**: `/submit/[documentBoxId]/upload`로 리다이렉트 되는지 확인

#### 시나리오 2: 공개 제출 페이지 → 이메일/비밀번호
1. 로그아웃 상태 확인
2. `/submit/[documentBoxId]` 접속
3. "로그인하고 제출하기" 클릭
4. 이메일/비밀번호 입력 후 로그인
5. **결과 확인**: `/submit/[documentBoxId]/upload`로 리다이렉트 되는지 확인

#### 시나리오 3: 대시보드 직접 접근 → Google OAuth
1. 로그아웃 상태 확인
2. `/dashboard` 직접 접속
3. `/sign-in?callbackURL=/dashboard`로 리다이렉트 확인
4. Google로 로그인
5. **결과 확인**: `/dashboard`로 리다이렉트 되는지 확인

#### 시나리오 4: 회원가입 플로우
1. 로그아웃 상태 확인
2. `/submit/[documentBoxId]` 접속
3. "로그인하고 제출하기" → 로그인 페이지
4. "회원가입" 링크 클릭
5. 새 계정으로 회원가입
6. **결과 확인**: `/submit/[documentBoxId]/upload`로 리다이렉트 되는지 확인

### 검증 체크리스트

| 항목 | 확인 방법 | 예상 결과 |
|------|----------|----------|
| 쿠키 생성 | 개발자 도구 > Application > Cookies | `auth_return_url` 쿠키 존재 |
| 쿠키 값 | 쿠키 값 확인 | `/submit/.../upload` 형태의 URL |
| 쿠키 삭제 | 로그인 성공 후 쿠키 확인 | `auth_return_url` 쿠키 삭제됨 |
| 리다이렉트 | 최종 URL 확인 | 원래 접근하려던 페이지로 이동 |

### 엣지 케이스 테스트

| 케이스 | 테스트 방법 | 예상 결과 |
|--------|------------|----------|
| callbackURL 없이 로그인 | `/sign-in` 직접 접속 후 로그인 | `/dashboard`로 이동 |
| 만료된 쿠키 | 1시간 후 로그인 시도 | 쿠키 만료, 기본 동작 |
| 잘못된 URL 쿠키 | 외부 URL이 쿠키에 저장된 경우 | `/dashboard`로 이동 (보안) |

---

## Git Worktree 사용법

### Git Worktree란?
하나의 Git 저장소에서 여러 브랜치를 동시에 다른 디렉토리에서 작업할 수 있게 해주는 기능.

### 기본 명령어

```bash
# 새 worktree 생성
git worktree add <경로> <브랜치명>

# 예시: feature-auth 브랜치를 ../feature-auth 디렉토리에서 작업
git worktree add ../feature-auth feature-auth

# 새 브랜치 생성하면서 worktree 추가
git worktree add -b new-branch ../new-branch-dir

# worktree 목록 확인
git worktree list

# worktree 삭제
git worktree remove <경로>

# 정리 (삭제된 worktree 참조 제거)
git worktree prune
```

### 사용 예시

```bash
# 현재 main 브랜치에서 작업 중
git branch
# * main

# 새 기능 브랜치를 별도 디렉토리에서 작업
git worktree add -b refactor/submit-after-auth ../submit-after-auth

# 해당 디렉토리로 이동
cd ../submit-after-auth

# 독립적으로 개발 진행
pnpm install
pnpm dev

# 작업 완료 후 메인 저장소로 돌아가기
cd ../main-repo

# worktree 삭제
git worktree remove ../submit-after-auth
```

### 장점
- 브랜치 전환 없이 여러 브랜치 동시 작업
- 긴 빌드/테스트 중에도 다른 브랜치 작업 가능
- PR 리뷰하면서 동시에 자신의 작업 진행

### 주의사항
- 같은 브랜치를 두 worktree에서 동시에 체크아웃할 수 없음
- worktree 삭제 전 변경사항 커밋 또는 스태시 필요
- `node_modules`는 각 worktree마다 별도 설치 필요

---

## 쿠키 설정 상세

```typescript
{
  name: 'auth_return_url',
  value: encodeURIComponent(url), // URL 인코딩
  options: {
    path: '/',           // 모든 경로에서 접근 가능
    maxAge: 3600,        // 1시간 후 만료
    httpOnly: false,     // 클라이언트 JS에서 접근 필요
    secure: true,        // HTTPS에서만 (프로덕션)
    sameSite: 'lax'      // CSRF 방지
  }
}
```

### 보안 고려사항
- **상대 경로만 허용**: `/`로 시작하는 URL만 저장 (open redirect 방지)
- **프로토콜 상대 URL 차단**: `//evil.com` 형태 차단
- **1시간 만료**: 오래된 쿠키로 인한 혼란 방지

---

## 트러블슈팅

### Q: 쿠키가 생성되지 않음
- 개발자 도구에서 쿠키 확인
- `callbackURL` 파라미터가 제대로 전달되는지 URL 확인
- HTTPS 환경인지 확인 (프로덕션)

### Q: 리다이렉트가 동작하지 않음
- 홈 페이지에서 `getSession()` 반환값 확인
- 쿠키 값이 올바른 형식인지 확인
- 서버 로그 확인

### Q: 무한 리다이렉트 발생
- 쿠키가 삭제되지 않는 경우 발생 가능
- `cookieStore.delete()` 호출 확인
- 브라우저 캐시/쿠키 수동 삭제 후 재시도

---

## 관련 문서

- [AUTH-SYSTEM.md](./AUTH-SYSTEM.md) - 전체 인증 시스템 개요
- [SUBMITTER-AUTH.md](./SUBMITTER-AUTH.md) - 제출자 인증 상세
- [API-AUTH.md](./API-AUTH.md) - API 인증 가이드
