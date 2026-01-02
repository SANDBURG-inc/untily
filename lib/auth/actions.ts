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
