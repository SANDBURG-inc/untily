import prisma from '@/lib/db';

/**
 * 문서함 관련 Prisma 쿼리 레이어
 * 재사용 가능한 쿼리 함수들을 제공
 */

// 제출자 정보 + 제출 현황 조회 결과 타입
export interface SubmitterWithStatus {
    submitterId: string;
    name: string;
    email: string;
    phone: string | null;
    submittedCount: number;
    lastSubmittedAt: Date | null;
}

// 문서함 상세 조회 결과 타입
export interface DocumentBoxDetail {
    documentBoxId: string;
    boxTitle: string;
    boxDescription: string | null;
    createdAt: Date;
    endDate: Date;
    userId: string;
    submitters: SubmitterWithStatus[];
    requiredDocuments: {
        requiredDocumentId: string;
        documentTitle: string;
        documentDescription: string | null;
        isRequired: boolean;
    }[];
    documentBoxRemindTypes: {
        remindType: 'EMAIL' | 'SMS' | 'PUSH';
    }[];
    reminderLogs: {
        id: string;
        sentAt: Date;
        channel: 'EMAIL' | 'SMS' | 'PUSH';
        isAuto: boolean;
        recipients: {
            submitter: {
                name: string;
            };
        }[];
    }[];
    totalRequiredDocuments: number;
}

/**
 * 문서함 상세 정보 조회 (제출 현황 포함)
 */
export async function getDocumentBoxWithSubmissionStatus(
    documentBoxId: string,
    userId: string
): Promise<DocumentBoxDetail | null> {
    const documentBox = await prisma.documentBox.findUnique({
        where: { documentBoxId },
        include: {
            submitters: {
                include: {
                    submittedDocuments: {
                        select: {
                            createdAt: true,
                        },
                    },
                },
            },
            requiredDocuments: true,
            documentBoxRemindTypes: true,
            reminderLogs: {
                orderBy: { sentAt: 'desc' },
                include: {
                    recipients: {
                        include: {
                            submitter: { select: { name: true } },
                        },
                    },
                },
            },
        },
    });

    if (!documentBox || documentBox.userId !== userId) {
        return null;
    }

    // 제출자별 제출 현황 계산
    const submittersWithStatus: SubmitterWithStatus[] = documentBox.submitters.map(submitter => {
        const submittedDocs = submitter.submittedDocuments;
        const lastSubmittedAt = submittedDocs.length > 0
            ? submittedDocs.reduce((latest, doc) =>
                doc.createdAt > latest ? doc.createdAt : latest, submittedDocs[0].createdAt)
            : null;

        return {
            submitterId: submitter.submitterId,
            name: submitter.name,
            email: submitter.email,
            phone: submitter.phone || null,
            submittedCount: submittedDocs.length,
            lastSubmittedAt,
        };
    });

    return {
        documentBoxId: documentBox.documentBoxId,
        boxTitle: documentBox.boxTitle,
        boxDescription: documentBox.boxDescription,
        createdAt: documentBox.createdAt,
        endDate: documentBox.endDate,
        userId: documentBox.userId,
        submitters: submittersWithStatus,
        requiredDocuments: documentBox.requiredDocuments,
        documentBoxRemindTypes: documentBox.documentBoxRemindTypes,
        reminderLogs: documentBox.reminderLogs,
        totalRequiredDocuments: documentBox.requiredDocuments.length,
    };
}

/**
 * 문서함 편집용 정보 조회
 */
export async function getDocumentBoxForEdit(documentBoxId: string, userId: string) {
    const documentBox = await prisma.documentBox.findUnique({
        where: { documentBoxId },
        include: {
            submitters: true,
            requiredDocuments: true,
            documentBoxRemindTypes: true,
        },
    });

    if (!documentBox || documentBox.userId !== userId) {
        return null;
    }

    return documentBox;
}

/**
 * 사용자의 문서함 목록 조회
 */
export async function getDocumentBoxesByUser(userId: string) {
    return prisma.documentBox.findMany({
        where: { userId },
        include: {
            submitters: true,
            requiredDocuments: true,
        },
        orderBy: { createdAt: 'desc' },
    });
}
