import { stackServerApp } from '@/stack/server';
import { redirect } from 'next/navigation';

/**
 * 인증 여부를 확인하고 미인증시 로그인 페이지로 리다이렉트하는 서버 함수
 *
 * @description
 * 사용자가 로그인되어 있지 않으면 /sign-in 페이지로 리다이렉트합니다.
 * 서버 컴포넌트에서 인증이 필요한 페이지에 사용합니다.
 *
 * @returns 인증된 사용자 객체
 *
 * @example
 * ```tsx
 * export default async function ProtectedPage() {
 *   const user = await ensureAuthenticated();
 *   return <div>안녕하세요, {user.displayName}님</div>;
 * }
 * ```
 */
export async function ensureAuthenticated() {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect('/sign-in');
  }
  return user;
}
