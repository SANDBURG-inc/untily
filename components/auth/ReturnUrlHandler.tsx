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
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">리다이렉트 중...</p>
      </div>
    </div>
  );
}
