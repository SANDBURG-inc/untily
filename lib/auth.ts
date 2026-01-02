/**
 * @fileoverview 서버 컴포넌트 전용 인증 모듈
 *
 * 이 파일은 서버 컴포넌트, 서버 액션, API 라우트에서 사용합니다.
 * 클라이언트 컴포넌트에서는 `@/lib/auth/client`의 authClient를 사용하세요.
 *
 * @example 인증 필수 페이지
 * ```tsx
 * import { ensureAuthenticated } from '@/lib/auth';
 *
 * export default async function DashboardPage() {
 *   const user = await ensureAuthenticated(); // 미로그인시 /sign-in으로 리다이렉트
 *   return <div>안녕하세요, {user.name}님</div>;
 * }
 * ```
 *
 * @example 선택적 인증 페이지
 * ```tsx
 * import { getSession } from '@/lib/auth';
 *
 * export default async function HomePage() {
 *   const { user } = await getSession();
 *   return user ? <Dashboard /> : <Landing />;
 * }
 * ```
 *
 * @see {@link file://@/lib/auth/client.ts} 클라이언트 컴포넌트용 인증
 * @see {@link file://@/lib/auth/submitter-auth.ts} 제출자 인증
 * @module lib/auth
 */
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import { redirect } from 'next/navigation';

/**
 * 인증된 사용자 타입
 *
 * Neon Auth에서 반환하는 사용자 정보를 나타냅니다.
 * 이 타입은 프로젝트 전체에서 공통으로 사용됩니다.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
 *   return <div>안녕하세요, {user.name}님</div>;
 * }
 * ```
 */
export async function ensureAuthenticated(): Promise<AuthenticatedUser> {
  const { session, user } = await neonAuth();

  if (!session || !user) {
    redirect('/sign-in');
  }

  return user as AuthenticatedUser;
}

/**
 * 현재 세션 정보를 가져오는 서버 함수 (리다이렉트 없음)
 *
 * @description
 * 인증 여부만 확인하고 리다이렉트하지 않습니다.
 * 선택적 인증이 필요한 페이지에서 사용합니다.
 *
 * @returns 세션과 사용자 정보 또는 null
 */
export async function getSession() {
  const { session, user } = await neonAuth();
  return { session, user };
}
