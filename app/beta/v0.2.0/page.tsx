'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth/client';

export default function BetaRedirectPage() {
    const [status, setStatus] = useState('로그아웃 중...');

    useEffect(() => {
        const redirectToBeta = async () => {
            try {
                await authClient.signOut();
                setStatus('로그인 페이지로 이동 중...');

                const params = new URLSearchParams({
                    callbackURL: '/dashboard',
                    email: 'sample@sandburg.co.kr',
                    password: 'welcome1!',
                });

                window.location.href = `/sign-in?${params.toString()}`;
            } catch {
                setStatus('오류가 발생했습니다. 다시 시도해주세요.');
            }
        };

        redirectToBeta();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">{status}</p>
            </div>
        </div>
    );
}
