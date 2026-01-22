/**
 * 자동 리마인더 발송 로직
 *
 * 30분마다 실행되어 해당 시간에 발송 예정인 리마인더를 처리합니다.
 * - ReminderSchedule 기반: 사용자가 설정한 발송 시점(n일/주 전, 시간)에 맞춰 발송
 * - 기존 DocumentBoxRemindType 기반: 하위 호환성 유지 (마감 3일 전, 09:00 발송)
 *
 * @module lib/cron/reminders
 */

import prisma from '@/lib/db';
import { Resend } from 'resend';
import { generateReminderEmailHtml } from '@/lib/email-templates';
import { getSubmissionUrl } from '@/lib/utils/url';

// ============================================================================
// Constants & Utils
// ============================================================================

// Resend API rate limit: 초당 2개 요청
// 안전 마진을 위해 600ms delay 사용
const RATE_LIMIT_DELAY_MS = 600;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// Types
// ============================================================================

interface ReminderResult {
    documentBoxId: string;
    title: string;
    scheduleId?: string;
    recipients: number;
    logId: string;
    source: 'schedule' | 'legacy';
}

interface ProcessResult {
    success: boolean;
    message: string;
    scheduleCount: number;
    totalEmailsSent: number;
    details: ReminderResult[];
}

interface DocumentBoxWithRelations {
    documentBoxId: string;
    userId: string; // 문서함 소유자 ID (템플릿 조회용)
    boxTitle: string;
    boxDescription: string | null;
    endDate: Date;
    requiredDocuments: {
        requiredDocumentId: string;
        documentTitle: string;
        documentDescription: string | null;
        isRequired: boolean;
    }[];
    submitters: {
        submitterId: string;
        name: string;
        email: string;
        submittedDocuments: {
            requiredDocumentId: string;
        }[];
    }[];
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * 자동 리마인더 발송 처리
 * node-cron에서 30분마다 호출됨
 */
export async function processReminders(): Promise<ProcessResult> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 현재 시간을 30분 단위로 정규화
    const normalizedMinute = currentMinute < 30 ? '00' : '30';
    const currentSendTime = `${String(currentHour).padStart(2, '0')}:${normalizedMinute}`;

    console.log(`[Auto-Reminder] Running at ${now.toISOString()}, sendTime: ${currentSendTime}`);

    let totalEmailsSent = 0;
    const results: ReminderResult[] = [];

    // ================================================================
    // 1. 새로운 ReminderSchedule 기반 발송 (isEnabled: true인 것만)
    // ================================================================
    const schedules = await prisma.reminderSchedule.findMany({
        where: {
            sendTime: currentSendTime,
            channel: 'EMAIL',
            isEnabled: true, // Off된 스케줄은 발송하지 않음
        },
        include: {
            documentBox: {
                include: {
                    requiredDocuments: true,
                    submitters: {
                        include: {
                            submittedDocuments: true,
                        },
                    },
                },
            },
        },
    });

    console.log(`[Auto-Reminder] Found ${schedules.length} schedules for ${currentSendTime}`);

    for (const schedule of schedules) {
        const box = schedule.documentBox;

        // 발송 대상 날짜 계산
        const targetDate = calculateTargetDate(box.endDate, schedule.timeValue, schedule.timeUnit);

        // 오늘이 발송 대상 날짜인지 확인
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);

        if (today.getTime() !== targetDate.getTime()) {
            continue;
        }

        // 스케줄별 템플릿 정보 전달
        const scheduleTemplate = {
            greetingHtml: schedule.greetingHtml ?? undefined,
            footerHtml: schedule.footerHtml ?? undefined,
        };

        // 미제출자 필터링 및 이메일 발송
        const emailResult = await sendReminderEmails(box, schedule.id, 'schedule', scheduleTemplate);
        if (emailResult) {
            totalEmailsSent += emailResult.emailsSent;
            results.push(emailResult.result);

            // Rate limit 방지: 문서함 간 delay
            await delay(RATE_LIMIT_DELAY_MS);
        }
    }

    // ================================================================
    // 2. 기존 DocumentBoxRemindType 기반 발송 (하위 호환성)
    // 09:00에만 실행, ReminderSchedule이 없는 문서함 대상
    // ================================================================
    if (currentSendTime === '09:00') {
        const legacyResult = await processLegacyReminders();
        totalEmailsSent += legacyResult.emailsSent;
        results.push(...legacyResult.results);
    }

    const message = `Processed at ${currentSendTime}. Sent ${totalEmailsSent} emails.`;
    console.log(`[Auto-Reminder] ${message}`);

    return {
        success: true,
        message,
        scheduleCount: schedules.length,
        totalEmailsSent,
        details: results,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 마감일 기준 발송 대상 날짜 계산
 */
function calculateTargetDate(endDate: Date, timeValue: number, timeUnit: string): Date {
    const target = new Date(endDate);

    if (timeUnit === 'DAY') {
        target.setDate(target.getDate() - timeValue);
    } else if (timeUnit === 'WEEK') {
        target.setDate(target.getDate() - timeValue * 7);
    }

    return target;
}

/**
 * 마감일까지 남은 일수 계산
 */
function calculateDaysLeft(endDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 리마인더 이메일 발송
 * @param box 문서함 정보
 * @param scheduleId 스케줄 ID (schedule 소스일 때)
 * @param source 발송 소스 (schedule: 새 시스템, legacy: 기존 시스템)
 * @param scheduleTemplate 스케줄별 템플릿 (있으면 우선 사용)
 */
async function sendReminderEmails(
    box: DocumentBoxWithRelations,
    scheduleId: string | undefined,
    source: 'schedule' | 'legacy',
    scheduleTemplate?: { greetingHtml?: string; footerHtml?: string }
): Promise<{ emailsSent: number; result: ReminderResult } | null> {
    // 필수 서류 필터링
    const requiredDocs = box.requiredDocuments.filter((d) => d.isRequired);
    const requiredDocIds = requiredDocs.map((d) => d.requiredDocumentId);

    if (requiredDocIds.length === 0) return null;

    // 미제출자 필터링
    const incompleteSubmitters = box.submitters.filter((submitter) => {
        if (!submitter.email) return false;
        const submittedDocIds = submitter.submittedDocuments.map((sd) => sd.requiredDocumentId);
        return !requiredDocIds.every((reqId) => submittedDocIds.includes(reqId));
    });

    if (incompleteSubmitters.length === 0) return null;

    console.log(
        `[Auto-Reminder] Box "${box.boxTitle}" has ${incompleteSubmitters.length} incomplete submitters (source: ${source})`
    );

    // 템플릿 결정: 스케줄별 템플릿 > 문서함 마지막 템플릿 > 기본
    let customGreetingHtml: string | undefined;
    let customFooterHtml: string | undefined;

    // 1. 스케줄별 템플릿이 있으면 우선 사용
    if (scheduleTemplate?.greetingHtml || scheduleTemplate?.footerHtml) {
        customGreetingHtml = scheduleTemplate.greetingHtml;
        customFooterHtml = scheduleTemplate.footerHtml;
        console.log(
            `[Auto-Reminder] Using schedule-specific template for box "${box.boxTitle}"`
        );
    } else {
        // 2. 문서함별 마지막 사용 템플릿을 폴백으로 사용
        const templateConfig = await prisma.documentBoxTemplateConfig.findUnique({
            where: {
                documentBoxId: box.documentBoxId,
            },
        });

        if (templateConfig?.lastGreetingHtml || templateConfig?.lastFooterHtml) {
            customGreetingHtml = templateConfig.lastGreetingHtml ?? undefined;
            customFooterHtml = templateConfig.lastFooterHtml ?? undefined;
            console.log(
                `[Auto-Reminder] Using document box's last template for box "${box.boxTitle}"`
            );
        }
    }

    const resend = new Resend(process.env.RESEND_API_KEY || process.env.SMTP_PASS);
    const daysLeft = calculateDaysLeft(box.endDate);

    const emails = incompleteSubmitters.map((submitter) => {
        const submissionLink = getSubmissionUrl(box.documentBoxId, submitter.submitterId);

        const emailHtml = generateReminderEmailHtml({
            submitterName: submitter.name,
            documentBoxTitle: box.boxTitle,
            documentBoxDescription: box.boxDescription,
            endDate: box.endDate,
            requiredDocuments: box.requiredDocuments.map((doc) => ({
                name: doc.documentTitle,
                description: doc.documentDescription,
                isRequired: doc.isRequired,
            })),
            submissionLink,
            customGreetingHtml,
            customFooterHtml,
        });

        return {
            from: 'untily@untily.kr',
            to: submitter.email,
            subject: `[리마인드] ${box.boxTitle} 서류 제출 마감 ${daysLeft}일 전입니다`,
            html: emailHtml,
        };
    });

    // ReminderLog 생성
    const log = await prisma.reminderLog.create({
        data: {
            documentBoxId: box.documentBoxId,
            channel: 'EMAIL',
            isAuto: true,
            sentAt: new Date(),
            recipients: {
                create: incompleteSubmitters.map((s) => ({
                    submitterId: s.submitterId,
                })),
            },
        },
    });

    // 배치 발송
    let emailsSent = 0;
    const chunkSize = 100;

    for (let i = 0; i < emails.length; i += chunkSize) {
        const chunk = emails.slice(i, i + chunkSize);
        if (i > 0) {
            // Rate limit 방지: chunk 간 delay
            await delay(RATE_LIMIT_DELAY_MS);
        }
        const { error } = await resend.batch.send(chunk);
        if (error) {
            console.error(
                `[Auto-Reminder] Failed to send batch for box ${box.documentBoxId}:`,
                error
            );
        } else {
            emailsSent += chunk.length;
        }
    }

    return {
        emailsSent,
        result: {
            documentBoxId: box.documentBoxId,
            title: box.boxTitle,
            scheduleId,
            recipients: incompleteSubmitters.length,
            logId: log.id,
            source,
        },
    };
}

/**
 * 기존 DocumentBoxRemindType 기반 리마인더 처리 (하위 호환성)
 * ReminderSchedule이 없고 DocumentBoxRemindType만 있는 문서함 대상
 */
async function processLegacyReminders(): Promise<{
    emailsSent: number;
    results: ReminderResult[];
}> {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 3);

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // ReminderSchedule이 없고 DocumentBoxRemindType만 있는 문서함 조회
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
            reminderSchedules: {
                none: {},
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

    console.log(
        `[Auto-Reminder] Found ${documentBoxes.length} legacy document boxes (no schedules)`
    );

    let totalEmailsSent = 0;
    const results: ReminderResult[] = [];

    for (const box of documentBoxes) {
        const emailResult = await sendReminderEmails(box, undefined, 'legacy');
        if (emailResult) {
            totalEmailsSent += emailResult.emailsSent;
            results.push(emailResult.result);

            // Rate limit 방지: 문서함 간 delay
            await delay(RATE_LIMIT_DELAY_MS);
        }
    }

    return { emailsSent: totalEmailsSent, results };
}
