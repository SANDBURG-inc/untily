/**
 * @fileoverview 로그인 후 리다이렉트 URL 관리 유틸리티
 *
 * OAuth 로그인 시 callbackURL이 손실되는 문제를 해결하기 위해
 * 쿠키 기반으로 return URL을 저장하고 관리합니다.
 *
 * @example 클라이언트 사이드 (로그인 폼)
 * ```tsx
 * import { setReturnUrlCookie, clearReturnUrlCookie } from '@/lib/auth/return-url';
 *
 * // 로그인 페이지 로드 시
 * useEffect(() => {
 *   if (callbackURL) {
 *     setReturnUrlCookie(callbackURL);
 *   }
 * }, [callbackURL]);
 *
 * // 로그인 성공 후
 * clearReturnUrlCookie();
 * ```
 *
 * @example 서버 사이드 (홈 페이지)
 * ```tsx
 * import { getReturnUrlFromCookies } from '@/lib/auth/return-url';
 * import { cookies } from 'next/headers';
 *
 * const returnUrl = getReturnUrlFromCookies(await cookies());
 * if (user && returnUrl) {
 *   redirect(returnUrl);
 * }
 * ```
 */

import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

/** 쿠키 이름 */
export const RETURN_URL_COOKIE = 'auth_return_url';

/** 기본 리다이렉트 경로 */
export const DEFAULT_REDIRECT = '/dashboard';

/** 쿠키 만료 시간 (1시간) */
const COOKIE_MAX_AGE = 60 * 60;

/**
 * 클라이언트 사이드: return URL을 쿠키에 저장
 *
 * @param url - 저장할 URL (예: '/submit/abc123/upload')
 */
export function setReturnUrlCookie(url: string): void {
  if (typeof document === 'undefined') return;

  // URL 유효성 검사 (상대 경로만 허용)
  if (!url.startsWith('/')) return;

  const isSecure = window.location.protocol === 'https:';
  const cookieValue = encodeURIComponent(url);
  const cookieOptions = [
    `${RETURN_URL_COOKIE}=${cookieValue}`,
    'path=/',
    `max-age=${COOKIE_MAX_AGE}`,
    'samesite=lax',
  ];

  if (isSecure) {
    cookieOptions.push('secure');
  }

  document.cookie = cookieOptions.join('; ');
}

/**
 * 클라이언트 사이드: return URL 쿠키 삭제
 */
export function clearReturnUrlCookie(): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${RETURN_URL_COOKIE}=; path=/; max-age=0`;
}

/**
 * 클라이언트 사이드: 쿠키에서 return URL 읽기
 *
 * @returns 저장된 URL 또는 null
 */
export function getReturnUrlCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === RETURN_URL_COOKIE && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * 서버 사이드: 쿠키에서 return URL 읽기
 *
 * @param cookies - Next.js cookies() 함수 반환값
 * @returns 저장된 URL 또는 null
 */
export function getReturnUrlFromCookies(
  cookies: ReadonlyRequestCookies
): string | null {
  const cookie = cookies.get(RETURN_URL_COOKIE);
  if (!cookie?.value) return null;

  const url = decodeURIComponent(cookie.value);

  // URL 유효성 검사 (상대 경로만 허용, 보안)
  if (!url.startsWith('/')) return null;

  return url;
}

/**
 * 최종 리다이렉트 URL 결정
 *
 * 우선순위:
 * 1. callbackURL 파라미터 (명시적 전달)
 * 2. 쿠키에 저장된 returnUrl (OAuth 플로우용)
 * 3. 기본값 (/dashboard)
 *
 * @param callbackURL - URL 파라미터로 전달된 콜백 URL
 * @param cookieUrl - 쿠키에서 읽은 return URL
 * @returns 최종 리다이렉트할 URL
 */
export function getRedirectUrl(
  callbackURL?: string | null,
  cookieUrl?: string | null
): string {
  // 우선순위 1: 명시적 callbackURL
  if (callbackURL && callbackURL.startsWith('/')) {
    return callbackURL;
  }

  // 우선순위 2: 쿠키에 저장된 URL
  if (cookieUrl && cookieUrl.startsWith('/')) {
    return cookieUrl;
  }

  // 기본값
  return DEFAULT_REDIRECT;
}

/**
 * URL이 유효한 리다이렉트 대상인지 확인
 *
 * @param url - 확인할 URL
 * @returns 유효 여부
 */
export function isValidRedirectUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  // 상대 경로만 허용 (open redirect 방지)
  if (!url.startsWith('/')) return false;

  // 프로토콜 상대 URL 방지 (//evil.com)
  if (url.startsWith('//')) return false;

  return true;
}
