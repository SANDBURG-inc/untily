/**
 * 리마인드 관련 Prisma 쿼리 레이어
 *
 * 리마인드 로그 및 수신자 관련 재사용 가능한 쿼리 함수들을 제공합니다.
 *
 * ## 사용처
 * - app/dashboard/[id]/reminders/[logId]/page.tsx (리마인드 로그 상세)
 * - components/dashboard/detail/ReminderHistory.tsx (리마인드 내역 표시)
 * - lib/auth/submitter-auth.ts (OPEN_SOMEONE 상태 제출 허용 판단)
 *
 * ## 관련 파일
 * - lib/types/reminder.ts - 타입, 상수, 유틸리티 함수
 * - lib/queries/document-box.ts - 문서함 쿼리 (reminderLogs 포함)
 *
 * @module lib/queries/reminder
 */

import prisma from '@/lib/db';
import type { ReminderChannelType } from '@/lib/types/reminder';

// ============================================================================
// Types
// ============================================================================

/**
 * 리마인드 로그 기본 정보
 */
export interface ReminderLogBasic {
    /** 로그 ID */
    id: string;
    /** 발송 일시 */
    sentAt: Date;
    /** 발송 채널 */
    channel: ReminderChannelType;
    /** 자동 발송 여부 */
    isAuto: boolean;
    /** 문서함 ID */
    documentBoxId: string;
}

/**
 * 리마인드 로그 상세 정보 (페이지 렌더링용 메타데이터 포함)
 */
export interface ReminderLogDetail {
    /** 로그 기본 정보 */
    log: ReminderLogBasic;
    /** 총 수신자 수 */
    totalRecipients: number;
    /** 총 페이지 수 */
    totalPages: number;
    /** 문서함의 필수 서류 개수 */
    totalRequiredDocs: number;
    /** 대표 수신자 이름 (타이틀 표시용) */
    firstRecipientName: string;
}

/**
 * 페이지네이션된 수신자 정보
 */
export interface PaginatedRecipient {
    /** 수신자 레코드 ID */
    id: string;
    /** 제출자 이름 */
    name: string;
    /** 제출 완료 여부 */
    isComplete: boolean;
}

/**
 * 페이지네이션된 수신자 목록 조회 결과
 */
export interface PaginatedRecipientsResult {
    /** 수신자 목록 */
    recipients: PaginatedRecipient[];
    /** 현재 페이지 */
    currentPage: number;
    /** 총 페이지 수 */
    totalPages: number;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * 리마인드 로그 상세 정보를 조회합니다.
 *
 * 로그 기본 정보, 수신자 통계, 필수 서류 수를 한 번에 조회합니다.
 * 페이지 타이틀 생성에 필요한 대표 수신자 이름도 함께 반환합니다.
 *
 * @param logId - 리마인드 로그 ID
 * @param documentBoxId - 문서함 ID (권한 검증용)
 * @param pageSize - 페이지당 항목 수 (총 페이지 계산용)
 * @returns 로그 상세 정보 또는 null (존재하지 않는 경우)
 *
 * @example
 * const detail = await getReminderLogDetail(logId, documentBoxId, 10);
 * if (!detail) notFound();
 * const title = formatReminderRecipientsCount(detail.firstRecipientName, detail.totalRecipients);
 */
export async function getReminderLogDetail(
    logId: string,
    documentBoxId: string,
    pageSize: number = 10
): Promise<ReminderLogDetail | null> {
    // 병렬로 독립적인 쿼리 실행
    const [log, totalRecipients, totalRequiredDocs, firstRecipient] = await Promise.all([
        // 1. 로그 기본 정보
        prisma.reminderLog.findUnique({
            where: { id: logId, documentBoxId },
        }),
        // 2. 총 수신자 수
        prisma.reminderRecipient.count({
            where: { reminderLogId: logId },
        }),
        // 3. 문서함의 필수 서류 수
        prisma.requiredDocument.count({
            where: { documentBoxId },
        }),
        // 4. 대표 수신자 (타이틀용)
        prisma.reminderRecipient.findFirst({
            where: { reminderLogId: logId },
            include: { submitter: { select: { name: true } } },
            orderBy: { submitter: { name: 'asc' } },
        }),
    ]);

    if (!log) {
        return null;
    }

    return {
        log: {
            id: log.id,
            sentAt: log.sentAt,
            channel: log.channel as ReminderChannelType,
            isAuto: log.isAuto,
            documentBoxId: log.documentBoxId,
        },
        totalRecipients,
        totalPages: Math.ceil(totalRecipients / pageSize),
        totalRequiredDocs,
        firstRecipientName: firstRecipient?.submitter.name ?? '알 수 없음',
    };
}

/**
 * 페이지네이션된 리마인드 수신자 목록을 조회합니다.
 *
 * 각 수신자의 제출 상태를 계산하여 반환합니다.
 * 이름 기준 오름차순으로 정렬됩니다.
 *
 * @param logId - 리마인드 로그 ID
 * @param documentBoxId - 문서함 ID (제출 문서 필터링용)
 * @param totalRequiredDocs - 필수 서류 총 개수 (제출 완료 판정 기준)
 * @param page - 현재 페이지 (1부터 시작)
 * @param pageSize - 페이지당 항목 수
 * @returns 페이지네이션된 수신자 목록
 *
 * @example
 * const { recipients, currentPage, totalPages } = await getPaginatedReminderRecipients(
 *     logId,
 *     documentBoxId,
 *     detail.totalRequiredDocs,
 *     1,
 *     10
 * );
 */
export async function getPaginatedReminderRecipients(
    logId: string,
    documentBoxId: string,
    totalRequiredDocs: number,
    page: number = 1,
    pageSize: number = 10
): Promise<PaginatedRecipientsResult> {
    const [recipients, totalCount] = await Promise.all([
        prisma.reminderRecipient.findMany({
            where: { reminderLogId: logId },
            include: {
                submitter: {
                    include: {
                        submittedDocuments: {
                            where: {
                                requiredDocument: {
                                    documentBoxId,
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                submitter: { name: 'asc' },
            },
            take: pageSize,
            skip: (page - 1) * pageSize,
        }),
        prisma.reminderRecipient.count({
            where: { reminderLogId: logId },
        }),
    ]);

    const transformedRecipients: PaginatedRecipient[] = recipients.map((recipient) => {
        const submittedCount = recipient.submitter.submittedDocuments.length;
        const isComplete = totalRequiredDocs > 0
            ? submittedCount >= totalRequiredDocs
            : false;

        return {
            id: recipient.id,
            name: recipient.submitter.name,
            isComplete,
        };
    });

    return {
        recipients: transformedRecipients,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
    };
}

// ============================================================================
// OPEN_SOMEONE 상태용 쿼리 함수
// ============================================================================

/**
 * 제출자가 마감 후 리마인드를 받았는지 확인
 *
 * OPEN_SOMEONE 상태에서 제출 허용 여부를 결정할 때 사용합니다.
 *
 * @param documentBoxId 문서함 ID
 * @param submitterId 제출자 ID
 * @returns 마감 후 리마인드를 받았으면 true
 *
 * @example
 * if (documentBox.status === 'OPEN_SOMEONE') {
 *   const canSubmit = await hasReceivedReminderAfterDeadline(documentBoxId, submitterId);
 *   if (!canSubmit) return { status: 'closed', documentBox };
 * }
 */
export async function hasReceivedReminderAfterDeadline(
    documentBoxId: string,
    submitterId: string
): Promise<boolean> {
    const recipient = await prisma.reminderRecipient.findFirst({
        where: {
            submitterId,
            reminderLog: {
                documentBoxId,
                sentAfterDeadline: true,
            },
        },
    });

    return recipient !== null;
}

/**
 * 문서함의 마감 후 리마인드 수신자 목록 조회
 *
 * @param documentBoxId 문서함 ID
 * @returns 마감 후 리마인드를 받은 제출자 ID 목록
 */
export async function getReminderRecipientsAfterDeadline(
    documentBoxId: string
): Promise<string[]> {
    const recipients = await prisma.reminderRecipient.findMany({
        where: {
            reminderLog: {
                documentBoxId,
                sentAfterDeadline: true,
            },
        },
        select: {
            submitterId: true,
        },
        distinct: ['submitterId'],
    });

    return recipients.map((r) => r.submitterId);
}
