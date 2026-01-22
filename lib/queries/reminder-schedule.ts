/**
 * 리마인드 스케줄 Prisma 쿼리 레이어
 *
 * 리마인드 스케줄의 활성화/비활성화 및 교체 로직을 중앙화합니다.
 * AutoReminderSettings(상세페이지)와 문서함 수정 API 양쪽에서 사용하여 일관성을 보장합니다.
 *
 * ## 사용처
 * - app/dashboard/[id]/actions.ts (saveReminderSchedules, disableAutoReminderV2, enableAutoReminderV2)
 * - app/api/document-box/[id]/route.ts (PUT - 문서함 수정)
 *
 * @module lib/queries/reminder-schedule
 */

import type { Prisma, PrismaClient } from '@/lib/generated/prisma/client';
import type { ReminderChannelType, ReminderTimeUnitType } from '@/lib/types/reminder';

// ============================================================================
// Types
// ============================================================================

/** 트랜잭션 클라이언트 또는 일반 PrismaClient */
type PrismaTransactionClient = Prisma.TransactionClient | PrismaClient;

/**
 * 리마인드 스케줄 입력 데이터
 */
export interface ReminderScheduleInput {
    timeValue: number;
    timeUnit: ReminderTimeUnitType;
    sendTime: string;
    channel: ReminderChannelType;
    templateId?: string | null;
    greetingHtml?: string | null;
    footerHtml?: string | null;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * 리마인드 스케줄 활성화/비활성화
 *
 * 스케줄 데이터는 유지하고 isEnabled 플래그만 변경합니다.
 * Switch 토글 시 사용됩니다.
 *
 * @param tx - Prisma 트랜잭션 클라이언트 또는 PrismaClient
 * @param documentBoxId - 문서함 ID
 * @param enabled - 활성화 여부
 *
 * @example
 * // 비활성화 (스케줄 설정은 유지)
 * await setReminderScheduleEnabled(tx, documentBoxId, false);
 *
 * // 활성화 (기존 스케줄 복원)
 * await setReminderScheduleEnabled(tx, documentBoxId, true);
 */
export async function setReminderScheduleEnabled(
    tx: PrismaTransactionClient,
    documentBoxId: string,
    enabled: boolean
): Promise<void> {
    await tx.reminderSchedule.updateMany({
        where: { documentBoxId },
        data: { isEnabled: enabled },
    });
}

/**
 * 리마인드 스케줄 교체 (삭제 → 생성)
 *
 * 기존 스케줄을 모두 삭제하고 새 스케줄로 교체합니다.
 * 스케줄 설정 저장 시 사용됩니다.
 *
 * @param tx - Prisma 트랜잭션 클라이언트 또는 PrismaClient
 * @param documentBoxId - 문서함 ID
 * @param schedules - 새 스케줄 목록
 * @param isEnabled - 활성화 여부 (기본값: true)
 *
 * @example
 * await replaceReminderSchedules(tx, documentBoxId, [
 *   { timeValue: 3, timeUnit: 'DAY', sendTime: '09:00', channel: 'EMAIL' },
 *   { timeValue: 1, timeUnit: 'DAY', sendTime: '10:00', channel: 'EMAIL' },
 * ], true);
 */
export async function replaceReminderSchedules(
    tx: PrismaTransactionClient,
    documentBoxId: string,
    schedules: ReminderScheduleInput[],
    isEnabled: boolean = true
): Promise<void> {
    // 기존 스케줄 삭제
    await tx.reminderSchedule.deleteMany({
        where: { documentBoxId },
    });

    // 새 스케줄 생성
    if (schedules.length > 0) {
        await tx.reminderSchedule.createMany({
            data: schedules.map((schedule, index) => ({
                documentBoxId,
                timeValue: schedule.timeValue,
                timeUnit: schedule.timeUnit,
                sendTime: schedule.sendTime,
                channel: schedule.channel,
                order: index,
                isEnabled,
                templateId: schedule.templateId ?? null,
                greetingHtml: schedule.greetingHtml ?? null,
                footerHtml: schedule.footerHtml ?? null,
            })),
        });
    }
}

/**
 * 리마인드 스케줄 처리 (문서함 수정 시 사용)
 *
 * 세 가지 시나리오를 처리합니다:
 * 1. 스케줄 전달됨 → 삭제 후 새로 생성
 * 2. 스케줄 없음 + Off → 기존 스케줄 비활성화
 * 3. 스케줄 없음 + On → 기존 스케줄 활성화
 *
 * @param tx - Prisma 트랜잭션 클라이언트
 * @param documentBoxId - 문서함 ID
 * @param schedules - 새 스케줄 목록 (undefined면 스케줄 변경 없음)
 * @param reminderEnabled - 리마인드 활성화 여부
 *
 * @example
 * // 문서함 수정 API에서 사용
 * await handleReminderScheduleUpdate(tx, id, reminderSchedules, reminderEnabled);
 */
export async function handleReminderScheduleUpdate(
    tx: PrismaTransactionClient,
    documentBoxId: string,
    schedules: ReminderScheduleInput[] | undefined,
    reminderEnabled: boolean
): Promise<void> {
    if (schedules && schedules.length > 0) {
        // 스케줄이 전달되면 교체
        await replaceReminderSchedules(tx, documentBoxId, schedules, reminderEnabled);
    } else if (!reminderEnabled) {
        // 리마인드 Off이고 스케줄이 없으면 비활성화만
        await setReminderScheduleEnabled(tx, documentBoxId, false);
    } else {
        // 리마인드 On이고 스케줄이 없으면 활성화만
        await setReminderScheduleEnabled(tx, documentBoxId, true);
    }
}
