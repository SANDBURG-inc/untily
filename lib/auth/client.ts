/**
 * @fileoverview 클라이언트 컴포넌트 전용 인증 모듈
 *
 * 이 파일은 클라이언트 컴포넌트('use client')에서만 사용해야 합니다.
 * 서버 컴포넌트에서는 `@/lib/auth`의 함수들을 사용하세요.
 *
 * @example 로그인
 * ```tsx
 * 'use client';
 * import { authClient } from '@/lib/auth/client';
 *
 * await authClient.signIn.email({ email, password });
 * ```
 *
 * @example 소셜 로그인
 * ```tsx
 * await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' });
 * ```
 *
 * @example 로그아웃
 * ```tsx
 * await authClient.signOut();
 * ```
 *
 * @see {@link file://@/lib/auth.ts} 서버 컴포넌트용 인증
 * @see {@link file://@/lib/auth/submitter-auth.ts} 제출자 인증
 * @module lib/auth/client
 */
'use client';

import { createAuthClient } from '@neondatabase/neon-js/auth/next';

/**
 * Neon Auth 클라이언트 인스턴스
 *
 * 클라이언트 컴포넌트에서 로그인, 회원가입, 로그아웃 등의 인증 작업에 사용합니다.
 *
 * @remarks
 * - 이 클라이언트는 브라우저에서만 동작합니다
 * - 서버 컴포넌트에서는 `neonAuth()` 또는 `ensureAuthenticated()`를 사용하세요
 *
 * @example 이메일 로그인
 * ```tsx
 * const result = await authClient.signIn.email({
 *   email: 'user@example.com',
 *   password: 'password123',
 * });
 * if (result.error) {
 *   console.error(result.error.message);
 * }
 * ```
 *
 * @example 회원가입
 * ```tsx
 * const result = await authClient.signUp.email({
 *   email: 'user@example.com',
 *   password: 'password123',
 *   name: '홍길동',
 * });
 * ```
 *
 * @example 비밀번호 재설정
 * ```tsx
 * await authClient.forgetPassword.emailOtp({ email: 'user@example.com' });
 * ```
 */
export const authClient = createAuthClient();
