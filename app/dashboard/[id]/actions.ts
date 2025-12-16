'use server';

import prisma from "@/lib/db";
import { RemindType } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { Resend } from 'resend';
import { generateReminderEmailHtml } from '@/lib/email-templates';

export async function disableAutoReminder(documentBoxId: string) {
    try {
        await prisma.documentBoxRemindType.deleteMany({
            where: { documentBoxId },
        });
        revalidatePath(`/dashboard/${documentBoxId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to disable auto reminder:", error);
        return { success: false, error: "Failed to disable auto reminder" };
    }
}

export async function enableAutoReminder(documentBoxId: string, type: RemindType) {
    try {
        // 이미 존재하는지 확인 후 생성 (중복 방지)
        const exists = await prisma.documentBoxRemindType.findUnique({
            where: {
                documentBoxId_remindType: {
                    documentBoxId,
                    remindType: type,
                },
            },
        });

        if (!exists) {
            await prisma.documentBoxRemindType.create({
                data: {
                    documentBoxId,
                    remindType: type,
                },
            });
        }
        revalidatePath(`/dashboard/${documentBoxId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to enable auto reminder:", error);
        return { success: false, error: "Failed to enable auto reminder" };
    }
}

export async function sendManualReminder(documentBoxId: string, recipientIds: string[]) {
    try {
        // 1. Fetch details for email
        const documentBox = await prisma.documentBox.findUnique({
            where: { documentBoxId },
            include: { requiredDocuments: true }
        });

        if (!documentBox) {
            throw new Error("DocumentBox not found");
        }

        const submitters = await prisma.submitter.findMany({
            where: { submitterId: { in: recipientIds } }
        });

        // 2. Create Reminder Log
        const log = await prisma.reminderLog.create({
            data: {
                documentBoxId,
                channel: "EMAIL",
                isAuto: false,
                sentAt: new Date(),
                recipients: {
                    create: recipientIds.map(submitterId => ({
                        submitterId
                    }))
                }
            }
        });

        // 3. Configure Resend
        const resend = new Resend(process.env.RESEND_API_KEY || process.env.SMTP_PASS);

        // 4. Prepare Batch Emails
        const emails = submitters
            .filter(submitter => submitter.email)
            .map(submitter => {
                const submissionLink = `https://submit.untily.kr/${documentBoxId}/${submitter.submitterId}`;

                const emailHtml = generateReminderEmailHtml({
                    submitterName: submitter.name,
                    documentBoxTitle: documentBox.boxTitle,
                    documentBoxDescription: documentBox.boxDescription,
                    endDate: documentBox.endDate,
                    requiredDocuments: documentBox.requiredDocuments.map(doc => ({
                        name: doc.documentTitle,
                        description: doc.documentDescription,
                        isRequired: doc.isRequired
                    })),
                    submissionLink: submissionLink
                });

                return {
                    from: 'untily@untily.kr',
                    to: submitter.email,
                    subject: `[문서 제출 요청] ${documentBox.boxTitle} 서류 제출`,
                    html: emailHtml,
                };
            });

        if (emails.length > 0) {
            // 5. Send Batch
            const { data, error } = await resend.batch.send(emails);

            if (error) {
                console.error("Failed to send batch emails:", error);
                throw new Error("Failed to send batch emails");
            }

            console.log(`Sent batch emails to ${emails.length} recipients for log ${log.id}`, data);
        }

        revalidatePath(`/dashboard/${documentBoxId}`);
        return { success: true, logId: log.id };
    } catch (error) {
        console.error("Failed to send manual reminder:", error);
        return { success: false, error: "Failed to send manual reminder" };
    }
}
