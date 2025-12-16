'use server';

import prisma from "@/lib/db";
import { RemindType } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";
import nodemailer from 'nodemailer';
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

        // 3. Configure Transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER || 'ethereal_user',
                pass: process.env.SMTP_PASS || 'ethereal_pass',
            },
        });

        // 4. Send Emails sequentially to avoid rate limits (2 req/s)
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (const submitter of submitters) {
            if (!submitter.email) continue;

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

            try {
                //TODO 도메인 인증 후 수정
                await transporter.sendMail({
                    from: 'onboarding@resend.dev',
                    to: submitter.email,
                    subject: `[문서 제출 요청] ${documentBox.boxTitle} 서류 제출`,
                    html: emailHtml,
                });
                // Wait 600ms to stay under 2 requests/sec rate limit
                await delay(600);
            } catch (e) {
                console.error(`Failed to send email to ${submitter.email}`, e);
            }
        }

        console.log(`Sent emails to ${recipientIds.length} recipients for log ${log.id}`);

        revalidatePath(`/dashboard/${documentBoxId}`);
        return { success: true, logId: log.id };
    } catch (error) {
        console.error("Failed to send manual reminder:", error);
        return { success: false, error: "Failed to send manual reminder" };
    }
}
