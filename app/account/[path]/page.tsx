import { redirect } from 'next/navigation';

/**
 * 기존 Neon Auth의 AccountView 경로를 새로운 통합 계정 페이지로 리다이렉트
 *
 * 이전 경로:
 * - /account/settings
 * - /account/security
 * - /account/api-keys
 * - /account/organizations
 *
 * 새로운 경로:
 * - /account (통합 페이지)
 */
export default async function LegacyAccountPage() {
  redirect('/account');
}
