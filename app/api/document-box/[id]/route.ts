import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import type { CreateDocumentBoxRequest, CreateDocumentBoxResponse } from '@/lib/types/document';
import { deleteMultipleFromS3 } from '@/lib/s3/delete';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication
        const { user } = await neonAuth();
        if (!user) {
            return NextResponse.json<CreateDocumentBoxResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Check if document box exists and user owns it
        const existingBox = await prisma.documentBox.findUnique({
            where: { documentBoxId: id },
        });

        if (!existingBox) {
            return NextResponse.json<CreateDocumentBoxResponse>(
                { success: false, error: 'Document box not found' },
                { status: 404 }
            );
        }

        if (existingBox.userId !== user.id) {
            return NextResponse.json<CreateDocumentBoxResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const body: CreateDocumentBoxRequest & { force?: boolean } = await request.json();
        const {
            documentName,
            description,
            logoUrl,
            submittersEnabled,
            submitters,
            requirements,
            deadline,
            reminderEnabled,
            emailReminder,
            smsReminder,
            kakaoReminder,
            force
        } = body;

        // Validate required fields
        if (!documentName || !deadline) {
            return NextResponse.json<CreateDocumentBoxResponse>(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Parse deadline to DateTime
        const endDate = new Date(deadline);
        if (isNaN(endDate.getTime())) {
            return NextResponse.json<CreateDocumentBoxResponse>(
                { success: false, error: 'Invalid deadline date' },
                { status: 400 }
            );
        }

        // S3에서 삭제할 키들을 저장할 배열
        const s3KeysToDelete: string[] = [];

        // Update document box with all related data in a transaction
        const documentBox = await prisma.$transaction(async (tx) => {
            // Update the document box
            const box = await tx.documentBox.update({
                where: { documentBoxId: id },
                data: {
                    boxTitle: documentName,
                    boxDescription: description || null,
                    endDate,
                },
            });

            // 기존 문서함 로고 삭제
            await tx.logo.deleteMany({
                where: {
                    documentBoxId: id,
                    type: 'DOCUMENT_BOX',
                },
            });

            // 새 문서함 로고가 있으면 Logo 테이블에 저장
            if (logoUrl) {
                await tx.logo.create({
                    data: {
                        imageUrl: logoUrl,
                        userId: user.id,
                        type: 'DOCUMENT_BOX',
                        documentBoxId: id,
                    },
                });
            }

            // 제출자 처리: 기존 제출자 유지 + 새 제출자 추가, 삭제된 제출자 제거
            // Collect all conflicts instead of throwing immediately
            const conflictSubmitters: string[] = [];
            const conflictRequirements: string[] = [];

            // 제출자 처리: 기존 제출자 유지 + 새 제출자 추가, 삭제된 제출자 제거
            if (submittersEnabled) {
                const existingSubmitters = await tx.submitter.findMany({
                    where: { documentBoxId: id },
                });
                const existingSubmitterMap = new Map(existingSubmitters.map(s => [s.submitterId, s]));
                const processedSubmitterIds = new Set<string>();

                // 1. 제출자 업데이트 또는 생성
                if (submitters && submitters.length > 0) {
                    // 유효한 제출자 필터링
                    const validSubmitters = submitters.filter(s => s.email && s.name);
                    
                    for (const sub of validSubmitters) {
                        // ID 또는 이메일로 기존 제출자인지 확인
                        // ID가 있고 일치하면 업데이트
                        // ID는 없지만 이메일이 일치하면 업데이트
                        let existingId = sub.id;
                        if (!existingId) {
                            const match = existingSubmitters.find(es => es.email.toLowerCase() === sub.email.toLowerCase());
                            if (match) existingId = match.submitterId;
                        }

                        if (existingId && existingSubmitterMap.has(existingId)) {
                            // 기존 제출자 업데이트
                            await tx.submitter.update({
                                where: { submitterId: existingId },
                                data: {
                                    name: sub.name,
                                    email: sub.email,
                                    phone: sub.phone || '',
                                }
                            });
                            processedSubmitterIds.add(existingId);
                        } else {
                            // 새 제출자 생성
                            await tx.submitter.create({
                                data: {
                                    name: sub.name,
                                    email: sub.email,
                                    phone: sub.phone || '',
                                    documentBoxId: id,
                                }
                            });
                        }
                    }
                }

                // 2. 삭제된 제출자 처리
                for (const existingSub of existingSubmitters) {
                    if (!processedSubmitterIds.has(existingSub.submitterId)) {
                        const submissionCount = await tx.submittedDocument.count({
                            where: { submitterId: existingSub.submitterId },
                        });

                        if (submissionCount > 0) {
                            if (force) {
                                // S3 파일 삭제를 위해 제출 내역 조회
                                const submissions = await tx.submittedDocument.findMany({
                                    where: { submitterId: existingSub.submitterId },
                                    select: { s3Key: true }
                                });
                                // 삭제할 키 수집 (트랜잭션 성공 후 삭제)
                                submissions.forEach(s => s3KeysToDelete.push(s.s3Key));

                                // 제출 내역 먼저 삭제 (Cascade 효과)
                                await tx.submittedDocument.deleteMany({
                                    where: { submitterId: existingSub.submitterId }
                                });
                                // 알림 수신자 먼저 삭제
                                await tx.reminderRecipient.deleteMany({
                                    where: { submitterId: existingSub.submitterId }
                                });
                                // 그 다음 제출자 삭제
                                await tx.submitter.delete({
                                    where: { submitterId: existingSub.submitterId },
                                });
                            } else {
                                conflictSubmitters.push(existingSub.name);
                            }
                        } else {
                            // 알림 수신자 먼저 삭제
                            await tx.reminderRecipient.deleteMany({
                                where: { submitterId: existingSub.submitterId }
                            });
                            await tx.submitter.delete({
                                where: { submitterId: existingSub.submitterId },
                            });
                        }
                    }
                }
            }

            // 서류 항목 처리: 기존 항목 업데이트, 새 항목 생성, 삭제된 항목 제거
            const existingRequirements = await tx.requiredDocument.findMany({
                where: { documentBoxId: id },
            });
            const existingReqMap = new Map(existingRequirements.map(req => [req.requiredDocumentId, req]));
            const processedReqIds = new Set<string>();

            for (const req of requirements) {
                if (req.id && existingReqMap.has(req.id)) {
                    // 기존 항목 업데이트
                    await tx.requiredDocument.update({
                        where: { requiredDocumentId: req.id },
                        data: {
                            documentTitle: req.name,
                            documentDescription: req.description || null,
                            isRequired: req.type === '필수',
                        },
                    });
                    processedReqIds.add(req.id);
                } else {
                    // 새 항목 생성
                    await tx.requiredDocument.create({
                        data: {
                            documentTitle: req.name,
                            documentDescription: req.description || null,
                            isRequired: req.type === '필수',
                            documentBoxId: box.documentBoxId,
                        },
                    });
                }
            }

            // 목록에서 제거된 서류 항목 삭제
            for (const existingReq of existingRequirements) {
                if (!processedReqIds.has(existingReq.requiredDocumentId)) {
                    // 기존 제출 내역 확인
                    const submissionCount = await tx.submittedDocument.count({
                        where: { requiredDocumentId: existingReq.requiredDocumentId },
                    });

                    if (submissionCount > 0) {
                        if (force) {
                            // S3 파일 삭제를 위해 제출 내역 조회
                            const submissions = await tx.submittedDocument.findMany({
                                where: { requiredDocumentId: existingReq.requiredDocumentId },
                                select: { s3Key: true }
                            });
                             // 삭제할 키 수집 (트랜잭션 성공 후 삭제)
                             submissions.forEach(s => s3KeysToDelete.push(s.s3Key));

                            // 제출 내역 먼저 삭제
                             await tx.submittedDocument.deleteMany({
                                where: { requiredDocumentId: existingReq.requiredDocumentId }
                            });
                            // 그 다음 항목 삭제
                            await tx.requiredDocument.delete({
                                where: { requiredDocumentId: existingReq.requiredDocumentId },
                            });
                        } else {
                            conflictRequirements.push(existingReq.documentTitle);
                        }
                    } else {
                        await tx.requiredDocument.delete({
                            where: { requiredDocumentId: existingReq.requiredDocumentId },
                        });
                    }
                }
            }

            if (conflictSubmitters.length > 0 || conflictRequirements.length > 0) {
                // 충돌 타입과 이름을 명확히 구분하여 반환
                const errorData = JSON.stringify({
                    code: 'CONFLICT_WITH_SUBMISSIONS',
                    conflictSubmitters,
                    conflictRequirements
                });
                // 트랜잭션 롤백을 위해 에러 발생
                throw new Error(errorData);
            }


            // Delete existing reminder types and create new ones
            await tx.documentBoxRemindType.deleteMany({
                where: { documentBoxId: id },
            });


            if (reminderEnabled) {
                const remindTypes: Array<{ documentBoxId: string; remindType: 'EMAIL' | 'SMS' | 'PUSH' }> = [];

                if (emailReminder) {
                    remindTypes.push({
                        documentBoxId: box.documentBoxId,
                        remindType: 'EMAIL',
                    });
                }

                if (smsReminder) {
                    remindTypes.push({
                        documentBoxId: box.documentBoxId,
                        remindType: 'SMS',
                    });
                }

                if (kakaoReminder) {
                    remindTypes.push({
                        documentBoxId: box.documentBoxId,
                        remindType: 'PUSH',
                    });
                }

                if (remindTypes.length > 0) {
                    await tx.documentBoxRemindType.createMany({
                        data: remindTypes,
                    });
                }
            }

            return box;
        });

        // 트랜잭션이 성공적으로 완료된 후 S3 파일 삭제 수행
        if (s3KeysToDelete.length > 0) {
            await deleteMultipleFromS3(s3KeysToDelete);
        }

        return NextResponse.json<CreateDocumentBoxResponse>({
            success: true,
            documentBoxId: documentBox.documentBoxId,
        });
    } catch (error) {

        if (error instanceof Error) {
            try {
                // Try to parse structured error data (JSON)
                const errorData = JSON.parse(error.message);
                if (errorData.code === 'CONFLICT_WITH_SUBMISSIONS') {
                    return NextResponse.json(
                        { 
                            success: false, 
                            ...errorData,
                            error: 'Submission exists' 
                        },
                        { status: 409 }
                    );
                }
            } catch (e) {
                // Not a JSON error, check for old string format (legacy support)
                const msg = error.message;
                if (msg.startsWith('SUBMITTER_HAS_SUBMISSIONS:') || msg.startsWith('REQUIREMENT_HAS_SUBMISSIONS:')) {
                    const [typeCode, name] = msg.split(':');
                    const targetType = typeCode === 'SUBMITTER_HAS_SUBMISSIONS' ? 'submitter' : 'requirement';
                    
                    return NextResponse.json(
                        { 
                            success: false, 
                            code: 'CONFLICT_WITH_SUBMISSIONS',
                            target: targetType,
                            name: name,
                            names: [name],
                            error: 'Submission exists' 
                        },
                        { status: 409 }
                    );
                }
            }
        }

        console.error('Error updating document box:', error);
        return NextResponse.json<CreateDocumentBoxResponse>(
            { success: false, error: error instanceof Error ? error.message : 'Failed to update document box' },
            { status: 500 }
        );
    }
}
