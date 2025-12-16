import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Resend } from 'resend';
import { generateReminderEmailHtml } from '@/lib/email-templates';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(request: Request) {
    try {
        // 1. Calculate Target Date: Today + 3 days
        const today = new Date();
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + 3);

        // Normalize to YYYY-MM-DD for database query (assuming endDate is stored with time, we compare date parts)
        // Or better: Define a range for that day.
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        console.log(`[Auto-Reminder] Checking for deadlines between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);

        // 2. Find DocumentBoxes
        // - Ending on target date
        // - Has EMAIL reminder type enabled
        const documentBoxes = await prisma.documentBox.findMany({
            where: {
                endDate: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                documentBoxRemindTypes: {
                    some: {
                        remindType: 'EMAIL',
                    },
                },
            },
            include: {
                requiredDocuments: true,
                submitters: {
                    include: {
                        submittedDocuments: true,
                    },
                },
            },
        });

        console.log(`[Auto-Reminder] Found ${documentBoxes.length} document boxes expecting reminders.`);

        let totalEmailsSent = 0;
        const results = [];

        // 3. Process each DocumentBox
        for (const box of documentBoxes) {
            // Filter Required Docs
            const requiredDocs = box.requiredDocuments.filter(d => d.isRequired);
            const requiredDocIds = requiredDocs.map(d => d.requiredDocumentId);

            if (requiredDocIds.length === 0) continue; // No required docs, skip

            const incompleteSubmitters = box.submitters.filter(submitter => {
                if (!submitter.email) return false;

                // Check if all required docs are submitted
                const submittedDocIds = submitter.submittedDocuments.map(sd => sd.requiredDocumentId);
                const isComplete = requiredDocIds.every(reqId => submittedDocIds.includes(reqId));

                return !isComplete;
            });

            if (incompleteSubmitters.length === 0) continue;

            console.log(`[Auto-Reminder] Box "${box.boxTitle}" has ${incompleteSubmitters.length} incomplete submitters.`);

            // 4. Send Batch Emails
            const resend = new Resend(process.env.RESEND_API_KEY || process.env.SMTP_PASS);

            const emails = incompleteSubmitters.map(submitter => {
                const submissionLink = `https://submit.untily.kr/${box.documentBoxId}/${submitter.submitterId}`;

                const emailHtml = generateReminderEmailHtml({
                    submitterName: submitter.name,
                    documentBoxTitle: box.boxTitle,
                    documentBoxDescription: box.boxDescription,
                    endDate: box.endDate,
                    requiredDocuments: box.requiredDocuments.map(doc => ({
                        name: doc.documentTitle,
                        description: doc.documentDescription,
                        isRequired: doc.isRequired,
                    })),
                    submissionLink: submissionLink,
                });

                return {
                    from: 'untily@untily.kr',
                    to: submitter.email,
                    subject: `[리마인드] ${box.boxTitle} 서류 제출 마감 3일 전입니다`, // Slightly different subject for auto-reminder
                    html: emailHtml,
                };
            });

            if (emails.length > 0) {
                // Log BEFORE sending to capture intent, or AFTER to capture success? 
                // Let's create the log entry first so we have an ID for tracking, although we can't easily link batch email IDs back.
                // Actually, we'll create the log now.

                const log = await prisma.reminderLog.create({
                    data: {
                        documentBoxId: box.documentBoxId,
                        channel: 'EMAIL',
                        isAuto: true,
                        sentAt: new Date(),
                        recipients: {
                            create: incompleteSubmitters.map(s => ({ submitterId: s.submitterId }))
                        }
                    }
                });

                // Send in chunks of 100 just in case (Resend limit)
                // Assuming efficient for now, but simple chunking is safer
                const chunkSize = 100;
                for (let i = 0; i < emails.length; i += chunkSize) {
                    const chunk = emails.slice(i, i + chunkSize);
                    const { error } = await resend.batch.send(chunk);

                    if (error) {
                        console.error(`[Auto-Reminder] Failed to send batch for box ${box.documentBoxId}:`, error);
                    } else {
                        totalEmailsSent += chunk.length;
                    }
                }

                results.push({
                    documentBoxId: box.documentBoxId,
                    title: box.boxTitle,
                    recipients: incompleteSubmitters.length,
                    logId: log.id
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${documentBoxes.length} boxes. Sent ${totalEmailsSent} emails.`,
            details: results
        });

    } catch (error) {
        console.error('[Auto-Reminder] Error executing cron:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
