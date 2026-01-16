import { NextResponse } from 'next/server';
import { processReminders } from '@/lib/cron';

export const dynamic = 'force-dynamic';

/**
 * 자동 리마인더 발송 API (수동 트리거용)
 *
 * 실제 스케줄링은 instrumentation.ts + node-cron에서 처리됩니다.
 * 이 엔드포인트는 수동 테스트나 외부 트리거가 필요한 경우에 사용합니다.
 */
export async function GET() {
    try {
        const result = await processReminders();

        return NextResponse.json({
            success: result.success,
            message: result.message,
            scheduleCount: result.scheduleCount,
            details: result.details,
        });
    } catch (error) {
        console.error('[Auto-Reminder] Error executing cron:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
