import { NextResponse } from 'next/server';
import { processDeadlineNotifications } from '@/lib/cron';

export const dynamic = 'force-dynamic';

/**
 * 마감 알림 발송 API (수동 트리거용)
 *
 * 실제 스케줄링은 instrumentation.ts + node-cron에서 처리됩니다.
 * 이 엔드포인트는 수동 테스트나 외부 트리거가 필요한 경우에 사용합니다.
 *
 * @example
 * GET /api/cron/deadline-notification
 */
export async function GET() {
    try {
        const result = await processDeadlineNotifications();

        return NextResponse.json({
            success: result.success,
            message: result.message,
            notificationsSent: result.notificationsSent,
            details: result.details,
        });
    } catch (error) {
        console.error('[Deadline-Notification] Error executing cron:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
