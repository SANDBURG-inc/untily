/**
 * Cron 단일 실행 보장 (ADR-0001)
 *
 * PM2 cluster 4 인스턴스가 모두 node-cron 을 등록해도 job 본체는 1벌만 수행하도록
 * (jobName, slot) UNIQUE INSERT 로 디둡한다. 콜백 진입 시 호출하여 true 를 받은
 * 인스턴스만 실제 작업을 실행한다.
 *
 * - at-most-once: claim 을 작업 전 수행 → 승자 크래시 시 tick 유실 → 수동 /api/cron/*
 * - 풀러 안전: 단일 트랜잭션 INSERT (advisory lock 미사용)
 *
 * @module lib/cron/claim
 */

import prisma from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma/client';

const PRUNE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7d

function isUniqueViolation(error: unknown): boolean {
    return (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
    );
}

/**
 * Cron tick 선점.
 *
 * @param jobName 'reminders' | 'status-transition' | 'deadline-notification'
 * @param slotMs job 주기 (밀리초). reminders/status = 30 * 60_000, deadline = 24 * 60 * 60_000
 * @returns true = 승자 (작업 실행), false = 다른 인스턴스 선점 (스킵)
 * @throws DB 장애 등 예기치 못한 에러는 그대로 throw → 해당 tick 유실, 수동 복구
 */
export async function claimCronSlot(jobName: string, slotMs: number): Promise<boolean> {
    const slot = new Date(Math.floor(Date.now() / slotMs) * slotMs).toISOString();

    try {
        await prisma.cronRun.create({ data: { jobName, slot } });
    } catch (error) {
        if (isUniqueViolation(error)) {
            return false;
        }
        throw error;
    }

    // 승자만 기회적 prune (실패해도 본 작업에 영향 없음)
    prisma.cronRun
        .deleteMany({
            where: { claimedAt: { lt: new Date(Date.now() - PRUNE_RETENTION_MS) } },
        })
        .catch((error) => {
            console.warn('[Cron] CronRun prune failed:', error);
        });

    return true;
}
