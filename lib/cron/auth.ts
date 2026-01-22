/**
 * Cron API 인증 헬퍼
 *
 * 외부에서 cron API를 무단 호출하는 것을 방지합니다.
 * CRON_SECRET 환경변수를 설정하고, Authorization 헤더로 검증합니다.
 *
 * @example
 * // .env
 * CRON_SECRET=your-secret-key
 *
 * // API 호출
 * curl -H "Authorization: Bearer your-secret-key" /api/cron/reminders
 *
 * @module lib/cron/auth
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron API 요청 인증
 * @returns null이면 인증 성공, NextResponse면 에러 응답
 */
export function verifyCronAuth(request: NextRequest): NextResponse | null {
    const cronSecret = process.env.CRON_SECRET;

    // CRON_SECRET이 설정되지 않은 경우 (개발 환경에서는 허용)
    if (!cronSecret) {
        if (process.env.NODE_ENV === 'production') {
            console.error('[Cron Auth] CRON_SECRET not configured in production');
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }
        // 개발 환경에서는 경고만 출력
        console.warn('[Cron Auth] CRON_SECRET not set, skipping auth in development');
        return null;
    }

    // Authorization 헤더 검증
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
        return NextResponse.json(
            { success: false, error: 'Authorization header required' },
            { status: 401 }
        );
    }

    // Bearer 토큰 형식 검증
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return NextResponse.json(
            { success: false, error: 'Invalid authorization format. Use: Bearer <token>' },
            { status: 401 }
        );
    }

    // 토큰 검증
    if (token !== cronSecret) {
        return NextResponse.json(
            { success: false, error: 'Invalid authorization token' },
            { status: 403 }
        );
    }

    return null; // 인증 성공
}
