import { NextRequest, NextResponse } from 'next/server';
import { processStatusTransition } from '@/lib/cron';
import { verifyCronAuth } from '@/lib/cron/auth';

export const dynamic = 'force-dynamic';

/**
 * 문서함 상태 자동 전환 API (수동 트리거용)
 *
 * 실제 스케줄링은 instrumentation.ts + node-cron에서 처리됩니다.
 * 이 엔드포인트는 수동 테스트나 외부 트리거가 필요한 경우에 사용합니다.
 *
 * @requires Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
    // 인증 검증
    const authError = verifyCronAuth(request);
    if (authError) return authError;

    try {
        const result = await processStatusTransition();

        return NextResponse.json({
            success: result.success,
            message: result.message,
            transitionedCount: result.transitionedCount,
            details: result.details,
        });
    } catch (error) {
        console.error('[Status-Transition] Error executing cron:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
