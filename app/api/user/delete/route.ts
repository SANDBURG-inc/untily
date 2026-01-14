import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import { deleteMultipleFromS3 } from '@/lib/s3/delete';
import { S3_BUCKET, S3_REGION } from '@/lib/s3/client';
import type { TemplateFile } from '@/lib/types/document';

function extractS3Key(url: string): string | null {
    const prefix = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/`;
    if (url.startsWith(prefix)) {
        return url.slice(prefix.length);
    }
    return null;
}

export async function DELETE() {
    try {
        const { user } = await neonAuth();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = user.id;
        const s3KeysToDelete: string[] = [];

        await prisma.$transaction(async (tx) => {
            const documentBoxes = await tx.documentBox.findMany({
                where: { userId },
                include: {
                    submitters: {
                        include: {
                            submittedDocuments: true,
                            reminderRecipients: true,
                        },
                    },
                    requiredDocuments: {
                        include: {
                            submittedDocuments: true,
                        },
                    },
                    logos: true,
                    reminderLogs: {
                        include: {
                            recipients: true,
                        },
                    },
                    documentBoxRemindTypes: true,
                },
            });

            for (const box of documentBoxes) {
                for (const submitter of box.submitters) {
                    for (const doc of submitter.submittedDocuments) {
                        s3KeysToDelete.push(doc.s3Key);
                    }
                }

                for (const req of box.requiredDocuments) {
                    const templates = (req.templates as TemplateFile[] | null) || [];
                    for (const template of templates) {
                        if (template.s3Key) {
                            s3KeysToDelete.push(template.s3Key);
                        }
                    }
                    if (req.templateZipKey) {
                        s3KeysToDelete.push(req.templateZipKey);
                    }
                }

                for (const logo of box.logos) {
                    const logoKey = extractS3Key(logo.imageUrl);
                    if (logoKey) {
                        s3KeysToDelete.push(logoKey);
                    }
                }

                for (const log of box.reminderLogs) {
                    await tx.reminderRecipient.deleteMany({
                        where: { reminderLogId: log.id },
                    });
                }

                await tx.reminderLog.deleteMany({
                    where: { documentBoxId: box.documentBoxId },
                });

                await tx.submittedDocument.deleteMany({
                    where: { submitter: { documentBoxId: box.documentBoxId } },
                });

                await tx.reminderRecipient.deleteMany({
                    where: { submitter: { documentBoxId: box.documentBoxId } },
                });

                await tx.submitter.deleteMany({
                    where: { documentBoxId: box.documentBoxId },
                });

                await tx.requiredDocument.deleteMany({
                    where: { documentBoxId: box.documentBoxId },
                });

                await tx.documentBoxRemindType.deleteMany({
                    where: { documentBoxId: box.documentBoxId },
                });

                await tx.logo.deleteMany({
                    where: { documentBoxId: box.documentBoxId },
                });
            }

            await tx.documentBox.deleteMany({ where: { userId } });

            const defaultLogos = await tx.logo.findMany({
                where: { userId, type: 'DEFAULT' },
            });
            for (const logo of defaultLogos) {
                const logoKey = extractS3Key(logo.imageUrl);
                if (logoKey) {
                    s3KeysToDelete.push(logoKey);
                }
            }
            await tx.logo.deleteMany({
                where: { userId, type: 'DEFAULT' },
            });
        });

        if (s3KeysToDelete.length > 0) {
            await deleteMultipleFromS3(s3KeysToDelete);
        }

        return NextResponse.json({
            success: true,
            message: 'User data deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting user data:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to delete user data' },
            { status: 500 }
        );
    }
}
