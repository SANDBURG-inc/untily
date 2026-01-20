/**
 * Next.js Instrumentation Hook
 *
 * 서버 시작 시 한 번 실행되는 초기화 코드입니다.
 * Cron Job 스케줄러를 설정하여 외부 트리거 없이 자동 실행되도록 합니다.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    // Node.js 런타임에서만 실행 (Edge 런타임 제외)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        console.log('[Instrumentation] Registering server-side initialization...');

        // Cron Job 설정
        const { setupCronJobs } = await import('@/lib/cron');
        setupCronJobs();

        console.log('[Instrumentation] Server-side initialization completed');
    }
}
