import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import type { CreateDocumentBoxRequest, CreateDocumentBoxResponse } from '@/lib/types/document';

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

        const body: CreateDocumentBoxRequest = await request.json();
        const {
            documentName,
            description,
            requirements,
            deadline,
            reminderEnabled,
            emailReminder,
            smsReminder,
            kakaoReminder,
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

            // 제출자(submitter)는 수정 불가 - 생성 시에만 설정 가능

            // Delete existing required documents and create new ones
            await tx.requiredDocument.deleteMany({
                where: { documentBoxId: id },
            });

            if (requirements.length > 0) {
                await tx.requiredDocument.createMany({
                    data: requirements.map((req) => ({
                        documentTitle: req.name,
                        documentDescription: req.description || null,
                        isRequired: req.type === '필수',
                        documentBoxId: box.documentBoxId,
                    })),
                });
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

        return NextResponse.json<CreateDocumentBoxResponse>({
            success: true,
            documentBoxId: documentBox.documentBoxId,
        });
    } catch (error) {
        console.error('Error updating document box:', error);
        return NextResponse.json<CreateDocumentBoxResponse>(
            { success: false, error: 'Failed to update document box' },
            { status: 500 }
        );
    }
}
