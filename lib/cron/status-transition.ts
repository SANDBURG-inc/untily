/**
 * 문서함 상태 자동 전환 로직
 *
 * 30분마다 실행되어 마감일이 지난 OPEN 상태의 문서함을 CLOSED_EXPIRED로 전환합니다.
 *
 * 전환 규칙:
 * - OPEN → CLOSED_EXPIRED (마감일이 지난 경우에만)
 * - CLOSED, CLOSED_EXPIRED: 이미 닫힌 상태이므로 건드리지 않음
 * - OPEN_SOMEONE, OPEN_RESUME: 마감 후에도 제출을 허용하는 특수 상태이므로 전환하지 않음
 *
 * @module lib/cron/status-transition
 */

import prisma from '@/lib/db';

// ============================================================================
// Types
// ============================================================================

interface TransitionedBox {
    documentBoxId: string;
    title: string;
    endDate: Date;
}

interface ProcessResult {
    success: boolean;
    message: string;
    transitionedCount: number;
    details: TransitionedBox[];
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * 문서함 상태 자동 전환 처리
 * node-cron에서 30분마다 호출됨
 */
export async function processStatusTransition(): Promise<ProcessResult> {
    const now = new Date();
    console.log(`[Status-Transition] Running at ${now.toISOString()}`);

    // 마감일이 지났고 상태가 OPEN인 문서함 조회
    const expiredOpenBoxes = await prisma.documentBox.findMany({
        where: {
            status: 'OPEN',
            endDate: {
                lt: now, // 마감일이 현재 시간보다 이전
            },
        },
        select: {
            documentBoxId: true,
            boxTitle: true,
            endDate: true,
        },
    });

    console.log(
        `[Status-Transition] Found ${expiredOpenBoxes.length} expired OPEN document boxes`
    );

    // 상태 전환 수행
    const transitionedBoxes: TransitionedBox[] = [];

    if (expiredOpenBoxes.length > 0) {
        // 일괄 업데이트
        await prisma.documentBox.updateMany({
            where: {
                documentBoxId: {
                    in: expiredOpenBoxes.map((box) => box.documentBoxId),
                },
            },
            data: {
                status: 'CLOSED_EXPIRED',
            },
        });

        transitionedBoxes.push(
            ...expiredOpenBoxes.map((box) => ({
                documentBoxId: box.documentBoxId,
                title: box.boxTitle,
                endDate: box.endDate,
            }))
        );

        console.log(
            `[Status-Transition] Transitioned ${transitionedBoxes.length} boxes to CLOSED_EXPIRED`
        );
    }

    const message = `Processed at ${now.toISOString()}. Transitioned ${transitionedBoxes.length} document boxes.`;

    return {
        success: true,
        message,
        transitionedCount: transitionedBoxes.length,
        details: transitionedBoxes,
    };
}
