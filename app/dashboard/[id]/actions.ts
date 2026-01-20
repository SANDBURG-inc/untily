'use server';

import prisma from "@/lib/db";
import { RemindType, ReminderTimeUnit, DocumentBoxStatus } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { Resend } from 'resend';
import { generateReminderEmailHtml } from '@/lib/email-templates';
import {
    type ReminderScheduleInput,
    MAX_REMINDER_COUNT,
    TIME_VALUE_RANGE,
    SEND_TIME_OPTIONS,
    type ReminderTimeUnitType,
    type SendTimeOption,
} from '@/lib/types/reminder';

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

export async function sendManualReminder(
    documentBoxId: string,
    recipientIds: string[],
    customGreetingHtml?: string,
    customFooterHtml?: string
) {
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
                const submissionLink = `https://untily.kr/submit/${documentBoxId}/${submitter.submitterId}`;

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
                    submissionLink: submissionLink,
                    customGreetingHtml,
                    customFooterHtml,
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

        // 6. 마지막 사용 템플릿 저장 (커스텀 템플릿 사용 시)
        // 문서함별 템플릿 설정으로 저장
        if (customGreetingHtml || customFooterHtml) {
            await prisma.documentBoxTemplateConfig.upsert({
                where: {
                    documentBoxId,
                },
                update: {
                    lastGreetingHtml: customGreetingHtml || null,
                    lastFooterHtml: customFooterHtml || null,
                },
                create: {
                    documentBoxId,
                    lastGreetingHtml: customGreetingHtml || null,
                    lastFooterHtml: customFooterHtml || null,
                },
            });
        }

        revalidatePath(`/dashboard/${documentBoxId}`);
        return { success: true, logId: log.id };
    } catch (error) {
        console.error("Failed to send manual reminder:", error);
        return { success: false, error: "Failed to send manual reminder" };
    }
}

// ============================================================================
// 리마인더 스케줄 관련 액션
// ============================================================================

/**
 * 리마인더 스케줄 저장
 * 기존 스케줄을 모두 삭제하고 새로 생성합니다.
 */
export async function saveReminderSchedules(
    documentBoxId: string,
    schedules: ReminderScheduleInput[]
) {
    try {
        // 1. 검증: 최대 개수
        if (schedules.length > MAX_REMINDER_COUNT) {
            return {
                success: false,
                error: `리마인더는 최대 ${MAX_REMINDER_COUNT}개까지 설정할 수 있습니다.`,
            };
        }

        // 2. 각 스케줄 유효성 검증
        for (const schedule of schedules) {
            const range = TIME_VALUE_RANGE[schedule.timeUnit as keyof typeof TIME_VALUE_RANGE];
            if (!range) {
                return { success: false, error: '유효하지 않은 시간 단위입니다.' };
            }
            if (schedule.timeValue < range.min || schedule.timeValue > range.max) {
                return {
                    success: false,
                    error: `시간 값은 ${range.min}에서 ${range.max} 사이여야 합니다.`,
                };
            }
            if (!SEND_TIME_OPTIONS.includes(schedule.sendTime as SendTimeOption)) {
                return { success: false, error: '유효하지 않은 발송 시간입니다.' };
            }
        }

        // 3. 트랜잭션으로 기존 삭제 + 새로 생성
        await prisma.$transaction(async (tx) => {
            // 기존 스케줄 삭제
            await tx.reminderSchedule.deleteMany({
                where: { documentBoxId },
            });

            // 새 스케줄 생성 (템플릿 정보 포함)
            if (schedules.length > 0) {
                await tx.reminderSchedule.createMany({
                    data: schedules.map((schedule, index) => ({
                        documentBoxId,
                        timeValue: schedule.timeValue,
                        timeUnit: schedule.timeUnit as ReminderTimeUnit,
                        sendTime: schedule.sendTime,
                        channel: schedule.channel as RemindType,
                        order: index,
                        // 템플릿 정보
                        templateId: schedule.templateId || null,
                        greetingHtml: schedule.greetingHtml || null,
                        footerHtml: schedule.footerHtml || null,
                    })),
                });
            }
        });

        revalidatePath(`/dashboard/${documentBoxId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to save reminder schedules:', error);
        return { success: false, error: '리마인더 설정 저장에 실패했습니다.' };
    }
}

/**
 * 자동 리마인더 비활성화 (모든 스케줄 삭제)
 * 기존 disableAutoReminder와 함께 새 스케줄도 삭제합니다.
 */
export async function disableAutoReminderV2(documentBoxId: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // 기존 DocumentBoxRemindType 삭제 (하위 호환성)
            await tx.documentBoxRemindType.deleteMany({
                where: { documentBoxId },
            });
            // 새 ReminderSchedule 삭제
            await tx.reminderSchedule.deleteMany({
                where: { documentBoxId },
            });
        });

        revalidatePath(`/dashboard/${documentBoxId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to disable auto reminder:', error);
        return { success: false, error: '자동 리마인드 비활성화에 실패했습니다.' };
    }
}

// ============================================================================
// 문서함 상태 관리 액션
// ============================================================================

/**
 * 문서함 상태 변경
 *
 * 주의: 이 함수는 페이지 레벨에서 권한 확인이 완료된 후에만 호출되어야 합니다.
 *
 * @param documentBoxId 문서함 ID
 * @param newStatus 새 상태
 */
export async function updateDocumentBoxStatus(
    documentBoxId: string,
    newStatus: DocumentBoxStatus
) {
    try {
        await prisma.documentBox.update({
            where: { documentBoxId },
            data: { status: newStatus },
        });

        revalidatePath('/dashboard');
        revalidatePath(`/dashboard/${documentBoxId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to update document box status:', error);
        return { success: false, error: '상태 변경에 실패했습니다.' };
    }
}

/**
 * 마감 후 리마인드 발송 시 상태를 OPEN_SOMEONE으로 변경
 *
 * 주의: 이 함수는 페이지 레벨에서 권한 확인이 완료된 후에만 호출되어야 합니다.
 *
 * @param documentBoxId 문서함 ID
 * @param recipientIds 수신자 ID 목록
 */
export async function sendReminderAfterDeadline(
    documentBoxId: string,
    recipientIds: string[],
    customGreetingHtml?: string,
    customFooterHtml?: string
) {
    try {
        // 1. 문서함 조회
        const documentBox = await prisma.documentBox.findUnique({
            where: { documentBoxId },
            include: { requiredDocuments: true },
        });

        if (!documentBox) {
            return { success: false, error: '문서함을 찾을 수 없습니다.' };
        }

        // 2. 제출자 목록 조회
        const submitters = await prisma.submitter.findMany({
            where: { submitterId: { in: recipientIds } },
        });

        // 3. 리마인드 로그 생성 (sentAfterDeadline=true)
        const log = await prisma.reminderLog.create({
            data: {
                documentBoxId,
                channel: 'EMAIL',
                isAuto: false,
                sentAt: new Date(),
                sentAfterDeadline: true, // 마감 후 발송 표시
                recipients: {
                    create: recipientIds.map((submitterId) => ({
                        submitterId,
                    })),
                },
            },
        });

        // 4. 이메일 발송
        const resend = new Resend(process.env.RESEND_API_KEY || process.env.SMTP_PASS);

        const emails = submitters
            .filter((submitter) => submitter.email)
            .map((submitter) => {
                const submissionLink = `https://untily.kr/submit/${documentBoxId}/${submitter.submitterId}`;

                const emailHtml = generateReminderEmailHtml({
                    submitterName: submitter.name,
                    documentBoxTitle: documentBox.boxTitle,
                    documentBoxDescription: documentBox.boxDescription,
                    endDate: documentBox.endDate,
                    requiredDocuments: documentBox.requiredDocuments.map((doc) => ({
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
                    subject: `[문서 제출 요청] ${documentBox.boxTitle} 서류 제출`,
                    html: emailHtml,
                };
            });

        if (emails.length > 0) {
            const { error } = await resend.batch.send(emails);
            if (error) {
                console.error('Failed to send batch emails:', error);
                throw new Error('Failed to send batch emails');
            }
        }

        // 5. 상태를 OPEN_SOMEONE으로 변경 (아직 OPEN_SOMEONE이 아닌 경우)
        if (documentBox.status !== 'OPEN_SOMEONE') {
            await prisma.documentBox.update({
                where: { documentBoxId },
                data: { status: 'OPEN_SOMEONE' },
            });
        }

        // 6. 마지막 사용 템플릿 저장 (커스텀 템플릿 사용 시)
        // 문서함별 템플릿 설정으로 저장
        if (customGreetingHtml || customFooterHtml) {
            await prisma.documentBoxTemplateConfig.upsert({
                where: {
                    documentBoxId,
                },
                update: {
                    lastGreetingHtml: customGreetingHtml || null,
                    lastFooterHtml: customFooterHtml || null,
                },
                create: {
                    documentBoxId,
                    lastGreetingHtml: customGreetingHtml || null,
                    lastFooterHtml: customFooterHtml || null,
                },
            });
        }

        revalidatePath('/dashboard');
        revalidatePath(`/dashboard/${documentBoxId}`);
        revalidatePath(`/dashboard/${documentBoxId}/send`);

        return { success: true, logId: log.id };
    } catch (error) {
        console.error('Failed to send reminder after deadline:', error);
        return { success: false, error: '리마인드 발송에 실패했습니다.' };
    }
}
