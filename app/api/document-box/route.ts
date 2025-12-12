import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { stackServerApp } from '@/stack/server';
import type { CreateDocumentBoxRequest, CreateDocumentBoxResponse } from '@/lib/types/document';

export async function POST(request: Request) {
    try {
        // Check authentication
        const user = await stackServerApp.getUser();
        if (!user) {
            return NextResponse.json<CreateDocumentBoxResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body: CreateDocumentBoxRequest = await request.json();
        const {
            documentName,
            description,
            submittersEnabled,
            submitters,
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

        // Create document box with all related data in a transaction
        const documentBox = await prisma.$transaction(async (tx) => {
            // Create the document box
            const box = await tx.documentBox.create({
                data: {
                    boxTitle: documentName,
                    boxDescription: description || null,
                    endDate,
                    userId: user.id,
                },
            });

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

            // Create required documents
            if (requirements.length > 0) {
                await tx.requiredDocument.createMany({
                    data: requirements.map((req) => ({
                        documentTitle: req.name,
                        documentDescription: req.description || null,
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
