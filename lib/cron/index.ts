/**
 * Cron Job 스케줄러
 *
 * Next.js 서버 시작 시 instrumentation.ts에서 호출되어
 * node-cron을 사용한 주기적 작업을 스케줄링합니다.
 *
 * @module lib/cron
 */

import cron from 'node-cron';
import { processReminders } from './reminders';
import { processStatusTransition } from './status-transition';

// 중복 초기화 방지 플래그
let isInitialized = false;

/**
 * Cron Job 설정 및 시작
 * 서버 시작 시 한 번만 호출됨
 */
export function setupCronJobs(): void {
    // 이미 초기화된 경우 스킵
    if (isInitialized) {
        console.log('[Cron] Already initialized, skipping...');
        return;
    }
    isInitialized = true;

    console.log('[Cron] Initializing cron jobs...');

    // ================================================================
    // 30분마다 자동 리마인더 발송
    // 스케줄: */30 * * * * (매 시간 0분, 30분에 실행)
    // ================================================================
    cron.schedule('*/30 * * * *', async () => {
        const startTime = Date.now();
        console.log(`[Cron] Running reminder job at ${new Date().toISOString()}`);

        try {
            const result = await processReminders();
            const duration = Date.now() - startTime;
            console.log(
                `[Cron] Reminder job completed in ${duration}ms: ${result.totalEmailsSent} emails sent`
            );
        } catch (error) {
            console.error('[Cron] Reminder job failed:', error);
        }
    });

    // ================================================================
    // 30분마다 문서함 상태 자동 전환
    // 스케줄: */30 * * * * (매 시간 0분, 30분에 실행)
    // ================================================================
    cron.schedule('*/30 * * * *', async () => {
        const startTime = Date.now();
        console.log(`[Cron] Running status transition job at ${new Date().toISOString()}`);

        try {
            const result = await processStatusTransition();
            const duration = Date.now() - startTime;
            console.log(
                `[Cron] Status transition job completed in ${duration}ms: ${result.transitionedCount} boxes transitioned`
            );
        } catch (error) {
            console.error('[Cron] Status transition job failed:', error);
        }
    });

    console.log('[Cron] Cron jobs scheduled successfully');
    console.log('[Cron] - Reminder job: every 30 minutes');
    console.log('[Cron] - Status transition job: every 30 minutes');
}

// 개별 함수도 export (API Route에서 수동 트리거용)
export { processReminders } from './reminders';
export { processStatusTransition } from './status-transition';
