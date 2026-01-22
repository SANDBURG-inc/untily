/**
 * 문서함 마감 알림 로직
 *
 * 매일 09:00에 실행되어 문서함 생성자에게 마감 알림 이메일을 발송합니다.
 *
 * 발송 조건:
 * - D-3: 종료 3일 전, OPEN 상태 문서함
 * - D-Day (OPEN): 오늘 마감 예정인 문서함 (09:00 이후 마감)
 * - D-Day (CLOSED): 오늘 이미 마감된 문서함 (00:00~09:00 사이 마감)
 *
 * @module lib/cron/deadline-notification
 */

import prisma from '@/lib/db';
import { Resend } from 'resend';
import {
    generateDeadlineNotificationHtml,
    getDeadlineNotificationSubject,
} from '@/lib/email-templates';

// ============================================================================
// Constants & Utils
// ============================================================================

// Resend API rate limit: 초당 2개 요청
const RATE_LIMIT_DELAY_MS = 600;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// Types
// ============================================================================

interface NotificationResult {
    documentBoxId: string;
    title: string;
    ownerEmail: string;
    notificationType: 'd-3' | 'd-day' | 'closed';
    success: boolean;
    error?: string;
}

interface ProcessResult {
    success: boolean;
    message: string;
    notificationsSent: number;
    details: NotificationResult[];
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * 마감 알림 처리
 * node-cron에서 매일 09:00에 호출됨
 */
export async function processDeadlineNotifications(): Promise<ProcessResult> {
    const now = new Date();
    console.log(`[Deadline-Notification] Running at ${now.toISOString()}`);

    const results: NotificationResult[] = [];

    // ================================================================
    // 1. D-3 알림: 3일 후 마감 예정인 OPEN 상태 문서함
    // ================================================================
    const d3Results = await sendNotificationsForDaysUntil(3, 'd-3');
    results.push(...d3Results);

    // ================================================================
    // 2. D-Day 알림: 오늘 마감인 문서함 (두 가지 케이스)
    //    - OPEN: 아직 마감 전 (09:00~24:00 사이 마감 예정)
    //    - CLOSED_EXPIRED: 이미 마감됨 (00:00~09:00 사이 마감)
    // ================================================================
    const dDayResults = await sendDDayNotifications();
    results.push(...dDayResults);

    const successCount = results.filter((r) => r.success).length;
    const message = `Processed at ${now.toISOString()}. Sent ${successCount}/${results.length} notifications.`;
    console.log(`[Deadline-Notification] ${message}`);

    return {
        success: true,
        message,
        notificationsSent: successCount,
        details: results,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 날짜 전용 비교 (시간 무시)
 */
function getDateOnly(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * 특정 일수 후 마감인 OPEN 상태 문서함에 알림 발송 (D-3 전용)
 */
async function sendNotificationsForDaysUntil(
    daysUntil: number,
    notificationType: 'd-3'
): Promise<NotificationResult[]> {
    const today = getDateOnly(new Date());
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntil);

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // OPEN 상태이고 마감일이 target 날짜인 문서함 조회
    const documentBoxes = await prisma.documentBox.findMany({
        where: {
            status: 'OPEN',
            endDate: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        include: {
            submitters: true,
        },
    });

    console.log(
        `[Deadline-Notification] Found ${documentBoxes.length} boxes for ${notificationType} (${daysUntil} days until deadline)`
    );

    const results: NotificationResult[] = [];

    for (const box of documentBoxes) {
        const result = await sendNotification(box, notificationType);
        results.push(result);
        if (result.success) await delay(RATE_LIMIT_DELAY_MS);
    }

    return results;
}

/**
 * D-Day 알림 발송 (오늘 마감인 문서함)
 *
 * 두 가지 케이스를 모두 처리:
 * 1. OPEN 상태: 아직 마감 전 (09:00 이후 마감 예정)
 * 2. CLOSED_EXPIRED 상태: 이미 마감됨 (00:00~09:00 사이 마감)
 */
async function sendDDayNotifications(): Promise<NotificationResult[]> {
    const today = getDateOnly(new Date());
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // 오늘 마감인 문서함 조회 (OPEN 또는 CLOSED_EXPIRED)
    const documentBoxes = await prisma.documentBox.findMany({
        where: {
            status: { in: ['OPEN', 'CLOSED_EXPIRED'] },
            endDate: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        include: {
            submitters: true,
        },
    });

    // OPEN과 CLOSED_EXPIRED 분리
    const openBoxes = documentBoxes.filter((box) => box.status === 'OPEN');
    const closedBoxes = documentBoxes.filter((box) => box.status === 'CLOSED_EXPIRED');

    console.log(
        `[Deadline-Notification] D-Day: ${openBoxes.length} OPEN, ${closedBoxes.length} CLOSED_EXPIRED`
    );

    const results: NotificationResult[] = [];

    // OPEN 상태: "오늘 마감 예정" 알림
    for (const box of openBoxes) {
        const result = await sendNotification(box, 'd-day');
        results.push(result);
        if (result.success) await delay(RATE_LIMIT_DELAY_MS);
    }

    // CLOSED_EXPIRED 상태: "오늘 종료됨" 알림
    for (const box of closedBoxes) {
        const result = await sendNotification(box, 'closed');
        results.push(result);
        if (result.success) await delay(RATE_LIMIT_DELAY_MS);
    }

    return results;
}

/**
 * 개별 문서함에 알림 이메일 발송
 */
async function sendNotification(
    box: {
        documentBoxId: string;
        boxTitle: string;
        userId: string;
        endDate: Date;
        submitters: { status: string }[];
    },
    notificationType: 'd-3' | 'd-day' | 'closed'
): Promise<NotificationResult> {
    const { documentBoxId, boxTitle, userId, endDate, submitters } = box;

    // 문서함 소유자 이메일 조회
    const owner = await prisma.user.findFirst({
        where: { authUserId: userId },
        select: { email: true, name: true },
    });

    if (!owner?.email) {
        console.log(
            `[Deadline-Notification] No email found for box "${boxTitle}" owner`
        );
        return {
            documentBoxId,
            title: boxTitle,
            ownerEmail: '',
            notificationType,
            success: false,
            error: 'Owner email not found',
        };
    }

    // 제출 현황 계산
    const totalSubmitters = submitters.length;
    const submittedCount = submitters.filter((s) => s.status === 'SUBMITTED').length;
    const notSubmittedCount = totalSubmitters - submittedCount;

    // 이메일 생성
    const emailHtml = generateDeadlineNotificationHtml({
        ownerName: owner.name || undefined,
        documentBoxTitle: boxTitle,
        documentBoxId,
        endDate,
        totalSubmitters,
        submittedCount,
        notSubmittedCount,
        notificationType,
    });

    const subject = getDeadlineNotificationSubject(boxTitle, notificationType);

    // 이메일 발송
    const resend = new Resend(process.env.RESEND_API_KEY || process.env.SMTP_PASS);

    try {
        const { error } = await resend.emails.send({
            from: 'untily@untily.kr',
            to: owner.email,
            subject,
            html: emailHtml,
        });

        if (error) {
            console.error(
                `[Deadline-Notification] Failed to send email for box "${boxTitle}":`,
                error
            );
            return {
                documentBoxId,
                title: boxTitle,
                ownerEmail: owner.email,
                notificationType,
                success: false,
                error: error.message,
            };
        }

        console.log(
            `[Deadline-Notification] Sent ${notificationType} notification for box "${boxTitle}" to ${owner.email}`
        );

        return {
            documentBoxId,
            title: boxTitle,
            ownerEmail: owner.email,
            notificationType,
            success: true,
        };
    } catch (error) {
        console.error(
            `[Deadline-Notification] Error sending email for box "${boxTitle}":`,
            error
        );
        return {
            documentBoxId,
            title: boxTitle,
            ownerEmail: owner.email,
            notificationType,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
