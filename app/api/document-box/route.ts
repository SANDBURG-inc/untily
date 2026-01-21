import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import type { CreateDocumentBoxRequest, CreateDocumentBoxResponse, TemplateFile } from '@/lib/types/document';
import type { FormFieldGroupData, FormFieldData } from '@/lib/types/form-field';
import { createTemplateZip } from '@/lib/s3/zip';

export async function POST(request: Request) {
    try {
        // Check authentication
        const { user } = await neonAuth();
        if (!user) {
            return NextResponse.json<CreateDocumentBoxResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            documentName,
            description,
            logoUrl,
            submittersEnabled,
            submitters,
            requirements,
            formFieldGroups, // 기존 호환성
            formFields,       // 새 구조 (우선)
            formFieldsAboveDocuments,
            deadline,
            reminderEnabled,
            emailReminder,
            smsReminder,
            kakaoReminder,
        } = body as CreateDocumentBoxRequest & {
            formFieldGroups?: FormFieldGroupData[];
            formFields?: FormFieldData[];
            formFieldsAboveDocuments?: boolean;
        };

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

        // Create document box with all related data in a transaction
        const documentBox = await prisma.$transaction(async (tx) => {
            // Create the document box
            const box = await tx.documentBox.create({
                data: {
                    boxTitle: documentName,
                    boxDescription: description || null,
                    endDate,
                    userId: user.id,
                    hasSubmitter: submittersEnabled,
                    formFieldsAboveDocuments: formFieldsAboveDocuments ?? false,
                },
            });

            // 문서함 로고가 있으면 Logo 테이블에 저장
            if (logoUrl) {
                await tx.logo.create({
                    data: {
                        imageUrl: logoUrl,
                        userId: user.id,
                        type: 'DOCUMENT_BOX',
                        documentBoxId: box.documentBoxId,
                    },
                });
            }

            // Create submitters if enabled
            if (submittersEnabled && submitters.length > 0) {
                await tx.submitter.createMany({
                    data: submitters.map((submitter) => ({
                        name: submitter.name,
                        email: submitter.email,
                        phone: submitter.phone,
                        documentBoxId: box.documentBoxId,
                    })),
                });
            }

            // Create required documents (양식 파일 목록 포함, 순서 유지)
            if (requirements.length > 0) {
                await tx.requiredDocument.createMany({
                    data: requirements.map((req, index) => ({
                        documentTitle: req.name,
                        documentDescription: req.description || null,
                        isRequired: req.type === '필수',
                        allowMultipleFiles: req.allowMultiple ?? false,
                        order: req.order ?? index, // 순서 저장 (없으면 배열 인덱스 사용)
                        documentBoxId: box.documentBoxId,
                        templates: JSON.parse(JSON.stringify(req.templates || [])),
                    })),
                });
            }

            // Create form fields (정보 입력 항목 - 그룹 없이 직접 연결)
            // formFields 우선, 없으면 formFieldGroups에서 평탄화
            const fieldsToCreate: FormFieldData[] = formFields ||
                (formFieldGroups ? formFieldGroups.flatMap(g => g.fields) : []);

            if (fieldsToCreate.length > 0) {
                await tx.formField.createMany({
                    data: fieldsToCreate.map((field, index) => ({
                        fieldLabel: field.fieldLabel,
                        fieldType: field.fieldType,
                        placeholder: field.placeholder || null,
                        description: field.description || null,
                        isRequired: field.isRequired,
                        order: field.order ?? index,
                        options: JSON.parse(JSON.stringify(field.options || [])),
                        hasOtherOption: field.hasOtherOption ?? false,
                        documentBoxId: box.documentBoxId,
                    })),
                });
            }

            // Create reminder types if enabled
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

        // 트랜잭션 완료 후 ZIP 생성 (비동기, 실패해도 문서함 생성은 성공)
        try {
            const createdRequirements = await prisma.requiredDocument.findMany({
                where: { documentBoxId: documentBox.documentBoxId },
            });

            for (const req of createdRequirements) {
                const templates = (req.templates as TemplateFile[] | null) || [];

                // 양식 2개 이상일 때만 ZIP 생성
                if (templates.length >= 2) {
                    const zipKey = await createTemplateZip({
                        templates,
                        documentBoxId: documentBox.documentBoxId,
                        requiredDocumentId: req.requiredDocumentId,
                    });

                    if (zipKey) {
                        await prisma.requiredDocument.update({
                            where: { requiredDocumentId: req.requiredDocumentId },
                            data: { templateZipKey: zipKey },
                        });
                    }
                }
            }
        } catch (zipError) {
            // ZIP 생성 실패는 로깅만 (문서함 생성은 성공)
            console.error('Failed to create template ZIP:', zipError);
        }

        return NextResponse.json<CreateDocumentBoxResponse>({
            success: true,
            documentBoxId: documentBox.documentBoxId,
        });
    } catch (error) {
        console.error('Error creating document box:', error);
        return NextResponse.json<CreateDocumentBoxResponse>(
            { success: false, error: 'Failed to create document box' },
            { status: 500 }
        );
    }
}
