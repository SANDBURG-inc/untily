import prisma from '@/lib/db';
import type { DocumentBoxStatus } from '@/lib/types/document';
import type { SubmitterStatus } from '@/lib/types/submitter';

/**
 * 문서함 관련 Prisma 쿼리 레이어
 * 재사용 가능한 쿼리 함수들을 제공
 */

// 제출 파일 상세 정보 타입
export interface SubmittedFileDetail {
    submittedDocumentId: string;
    filename: string;
    originalFilename: string;
    size: number;
    mimeType: string;
    s3Key: string;
    createdAt: Date;
    documentTitle: string;
}

// 제출자 + 제출 파일 목록 타입
export interface SubmitterWithFiles {
    submitterId: string;
    name: string;
    email: string;
    phone: string | null;
    lastSubmittedAt: Date | null;
    files: SubmittedFileDetail[];
    // 재제출 이력 (제출자 상세에서 표시용)
    resubmissionLogs: ResubmissionLogInfo[];
}

// 재제출 기록 타입
export interface ResubmissionLogInfo {
    resubmittedAt: Date;
}

// 제출자 정보 + 제출 현황 조회 결과 타입
export interface SubmitterWithStatus {
    submitterId: string;
    name: string;
    email: string;
    phone: string | null;
    submittedCount: number;
    lastSubmittedAt: Date | null;
    // 신규 필드
    status: SubmitterStatus;
    isChecked: boolean;
    resubmissionLogs: ResubmissionLogInfo[];
}

// 문서함 상세 조회 결과 타입
export interface DocumentBoxDetail {
    documentBoxId: string;
    boxTitle: string;
    boxDescription: string | null;
    createdAt: Date;
    endDate: Date;
    userId: string;
    /** 문서함 상태 (OPEN, CLOSED, OPEN_SOMEONE, CLOSED_EXPIRED, OPEN_RESUME) */
    status: DocumentBoxStatus;
    // 지정 제출자 여부 (null은 true로 취급 - 후방호환성)
    // 관련 유틸: lib/utils/document-box.ts > hasDesignatedSubmitters()
    hasSubmitter: boolean | null;
    submitters: SubmitterWithStatus[];
    requiredDocuments: {
        requiredDocumentId: string;
        documentTitle: string;
        documentDescription: string | null;
        isRequired: boolean;
        templates: { s3Key: string; filename: string }[] | null;
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
    reminderSchedules: {
        id: string;
        timeValue: number;
        timeUnit: 'DAY' | 'WEEK';
        sendTime: string;
        channel: 'EMAIL' | 'SMS' | 'PUSH';
        order: number;
        isEnabled: boolean;
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
                orderBy: { name: 'asc' },
                include: {
                    submittedDocuments: {
                        select: {
                            createdAt: true,
                        },
                    },
                    resubmissionLogs: {
                        select: { resubmittedAt: true },
                        orderBy: { resubmittedAt: 'desc' },
                    },
                },
            },
            requiredDocuments: { orderBy: { order: 'asc' } },
            documentBoxRemindTypes: true,
            reminderLogs: {
                orderBy: { sentAt: 'desc' },
                include: {
                    recipients: {
                        orderBy: { submitter: { name: 'asc' } },
                        include: {
                            submitter: { select: { name: true } },
                        },
                    },
                },
            },
            reminderSchedules: {
                orderBy: { order: 'asc' },
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
            status: submitter.status as SubmitterStatus,
            isChecked: submitter.isChecked,
            resubmissionLogs: submitter.resubmissionLogs.map(log => ({
                resubmittedAt: log.resubmittedAt,
            })),
        };
    });

    return {
        documentBoxId: documentBox.documentBoxId,
        boxTitle: documentBox.boxTitle,
        boxDescription: documentBox.boxDescription,
        createdAt: documentBox.createdAt,
        endDate: documentBox.endDate,
        userId: documentBox.userId,
        status: documentBox.status as DocumentBoxStatus,
        hasSubmitter: documentBox.hasSubmitter,
        submitters: submittersWithStatus,
        requiredDocuments: documentBox.requiredDocuments.map(doc => ({
            ...doc,
            templates: (doc.templates as { s3Key: string; filename: string }[] | null) ?? null,
        })),
        documentBoxRemindTypes: documentBox.documentBoxRemindTypes,
        reminderLogs: documentBox.reminderLogs,
        reminderSchedules: documentBox.reminderSchedules,
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
            requiredDocuments: { orderBy: { order: 'asc' } },
            documentBoxRemindTypes: true,
            reminderSchedules: {
                orderBy: { order: 'asc' },
            },
            logos: {
                where: { type: 'DOCUMENT_BOX' },
                take: 1,
            },
            formFields: {
                orderBy: { order: 'asc' },
            },
        },
    });

    if (!documentBox || documentBox.userId !== userId) {
        return null;
    }

    return documentBox;
}

// 문서함 접근 정보 타입 (권한 체크용)
export interface DocumentBoxAccessInfo {
    exists: boolean;
    isOwner: boolean;
    hasSubmitter: boolean | null;
    submitterId: string | null; // 비소유자일 때 이메일로 찾은 submitter
}

/**
 * 문서함 접근 정보 조회 (권한 체크 + 리다이렉트용)
 * - 문서함 존재 여부와 소유권을 분리해서 확인
 * - 비소유자일 경우 이메일로 등록된 submitter 검색
 */
export async function getDocumentBoxAccessInfo(
    documentBoxId: string,
    userId: string,
    userEmail: string
): Promise<DocumentBoxAccessInfo | null> {
    const documentBox = await prisma.documentBox.findUnique({
        where: { documentBoxId },
        select: {
            userId: true,
            hasSubmitter: true,
            submitters: {
                where: { email: { equals: userEmail, mode: 'insensitive' } },
                select: { submitterId: true },
                take: 1,
            },
        },
    });

    // 문서함이 존재하지 않음
    if (!documentBox) {
        return null;
    }

    const isOwner = documentBox.userId === userId;

    return {
        exists: true,
        isOwner,
        hasSubmitter: documentBox.hasSubmitter,
        // 비소유자일 때만 submitterId 반환 (소유자는 필요 없음)
        submitterId: !isOwner && documentBox.submitters.length > 0
            ? documentBox.submitters[0].submitterId
            : null,
    };
}

/**
 * 사용자의 문서함 목록 조회
 */
export async function getDocumentBoxesByUser(userId: string) {
    return prisma.documentBox.findMany({
        where: { userId },
        include: {
            submitters: true,
            requiredDocuments: { orderBy: { order: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

// 제출 파일 정보 타입
export interface SubmittedFileInfo {
    submittedDocumentId: string;
    s3Key: string;
    filename: string;
    mimeType: string;
    submitterName: string;
    documentTitle: string;
}

/**
 * 문서함의 제출 파일 조회 (ZIP 다운로드용)
 * @param submitterIds 선택된 제출자 ID 배열 (없으면 전체)
 */
export async function getSubmittedFilesForDownload(
    documentBoxId: string,
    userId: string,
    submitterIds?: string[]
): Promise<{ files: SubmittedFileInfo[]; boxTitle: string } | null> {
    const documentBox = await prisma.documentBox.findUnique({
        where: { documentBoxId },
        include: {
            submitters: {
                where: submitterIds?.length ? { submitterId: { in: submitterIds } } : undefined,
                include: {
                    submittedDocuments: {
                        include: {
                            requiredDocument: true,
                        },
                    },
                },
            },
        },
    });

    if (!documentBox || documentBox.userId !== userId) {
        return null;
    }

    const files: SubmittedFileInfo[] = [];

    for (const submitter of documentBox.submitters) {
        for (const doc of submitter.submittedDocuments) {
            files.push({
                submittedDocumentId: doc.submittedDocumentId,
                s3Key: doc.s3Key,
                filename: doc.filename,
                mimeType: doc.mimeType,
                submitterName: submitter.name,
                documentTitle: doc.requiredDocument.documentTitle,
            });
        }
    }

    return { files, boxTitle: documentBox.boxTitle };
}

/**
 * 제출자의 제출 파일 상세 조회
 */
export async function getSubmitterWithFiles(
    documentBoxId: string,
    submitterId: string,
    userId: string
): Promise<SubmitterWithFiles | null> {
    const documentBox = await prisma.documentBox.findUnique({
        where: { documentBoxId },
        select: {
            userId: true,
            submitters: {
                where: { submitterId },
                include: {
                    submittedDocuments: {
                        include: {
                            requiredDocument: {
                                select: { documentTitle: true, order: true }
                            }
                        },
                        orderBy: [
                            { requiredDocument: { order: 'asc' } },
                            { createdAt: 'desc' }
                        ]
                    },
                    // 재제출 이력 조회 (최신순)
                    resubmissionLogs: {
                        select: { resubmittedAt: true },
                        orderBy: { resubmittedAt: 'desc' },
                    },
                }
            }
        }
    });

    if (!documentBox || documentBox.userId !== userId) {
        return null;
    }

    const submitter = documentBox.submitters[0];
    if (!submitter) return null;

    const files: SubmittedFileDetail[] = submitter.submittedDocuments.map(doc => ({
        submittedDocumentId: doc.submittedDocumentId,
        filename: doc.filename,
        originalFilename: doc.originalFilename,
        size: doc.size,
        mimeType: doc.mimeType,
        s3Key: doc.s3Key,
        createdAt: doc.createdAt,
        documentTitle: doc.requiredDocument.documentTitle
    }));

    const lastSubmittedAt = files.length > 0 ? files[0].createdAt : null;

    return {
        submitterId: submitter.submitterId,
        name: submitter.name,
        email: submitter.email,
        phone: submitter.phone,
        lastSubmittedAt,
        files,
        resubmissionLogs: submitter.resubmissionLogs.map(log => ({
            resubmittedAt: log.resubmittedAt,
        })),
    };
}

/**
 * 제출 파일 단일 조회 (권한 검증 포함)
 */
export async function getSubmittedFileById(
    documentBoxId: string,
    submittedDocumentId: string,
    userId: string
): Promise<{
    s3Key: string;
    filename: string;
    originalFilename: string;
    mimeType: string;
} | null> {
    const file = await prisma.submittedDocument.findUnique({
        where: { submittedDocumentId },
        include: {
            submitter: {
                include: {
                    documentBox: {
                        select: { documentBoxId: true, userId: true }
                    }
                }
            }
        }
    });

    if (!file ||
        file.submitter.documentBox.documentBoxId !== documentBoxId ||
        file.submitter.documentBox.userId !== userId) {
        return null;
    }

    return {
        s3Key: file.s3Key,
        filename: file.filename,
        originalFilename: file.originalFilename,
        mimeType: file.mimeType
    };
}
