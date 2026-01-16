import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * 문서함 상태 자동 전환 Cron Job
 *
 * 30분마다 실행되어 마감일이 지난 OPEN 상태의 문서함을 CLOSED_EXPIRED로 전환합니다.
 *
 * 전환 규칙:
 * - OPEN → CLOSED_EXPIRED (마감일이 지난 경우에만)
 * - CLOSED, CLOSED_EXPIRED: 이미 닫힌 상태이므로 건드리지 않음
 * - OPEN_SOMEONE, OPEN_RESUME: 마감 후에도 제출을 허용하는 특수 상태이므로 전환하지 않음
 */
export async function GET(request: Request) {
    try {
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
        const transitionedBoxes: {
            documentBoxId: string;
            title: string;
            endDate: Date;
        }[] = [];

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

        return NextResponse.json({
            success: true,
            message: `Processed at ${now.toISOString()}. Transitioned ${transitionedBoxes.length} document boxes.`,
            transitionedCount: transitionedBoxes.length,
            details: transitionedBoxes,
        });
    } catch (error) {
        console.error('[Status-Transition] Error executing cron:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
