/**
 * 기존 사용자 이메일 동기화 스크립트
 *
 * User 테이블에 email 필드가 추가된 후, 기존 사용자의 이메일을
 * Neon Auth에서 조회하여 동기화합니다.
 *
 * 실행 방법:
 * npx tsx scripts/sync-user-emails.ts
 *
 * @module scripts/sync-user-emails
 */

import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

interface NeonAuthUser {
    id: string;
    email: string;
    name?: string;
}

/**
 * Neon Auth Management API를 통해 사용자 목록 조회
 *
 * 환경변수:
 * - NEON_API_KEY: Neon Auth API 키
 * - NEON_PROJECT_ID: Neon 프로젝트 ID
 */
async function fetchNeonAuthUsers(): Promise<NeonAuthUser[]> {
    const apiKey = process.env.NEON_API_KEY;
    const projectId = process.env.NEON_PROJECT_ID;

    if (!apiKey || !projectId) {
        console.error('환경변수가 설정되지 않았습니다: NEON_API_KEY, NEON_PROJECT_ID');
        console.log('Neon Console에서 API 키를 생성하세요: https://console.neon.tech/');
        return [];
    }

    try {
        // Neon Auth Management API 호출
        // 문서: https://neon.tech/docs/guides/neon-auth
        const response = await fetch(
            `https://console.neon.tech/api/v2/projects/${projectId}/auth/users`,
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Neon Auth API 오류: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.users || [];
    } catch (error) {
        console.error('Neon Auth 사용자 조회 실패:', error);
        return [];
    }
}

/**
 * 이메일 동기화 실행
 */
async function syncUserEmails(): Promise<void> {
    console.log('=== 사용자 이메일 동기화 시작 ===\n');

    // 1. 이메일이 없는 사용자 조회
    const usersWithoutEmail = await prisma.user.findMany({
        where: {
            email: null,
        },
        select: {
            userId: true,
            authUserId: true,
            name: true,
        },
    });

    console.log(`이메일이 없는 사용자: ${usersWithoutEmail.length}명\n`);

    if (usersWithoutEmail.length === 0) {
        console.log('모든 사용자가 이메일을 가지고 있습니다.');
        return;
    }

    // 2. Neon Auth에서 사용자 목록 조회
    const neonAuthUsers = await fetchNeonAuthUsers();

    if (neonAuthUsers.length === 0) {
        console.log('Neon Auth에서 사용자를 조회할 수 없습니다.');
        console.log('\n=== 수동 동기화 SQL ===');
        console.log('아래 SQL을 Neon Console에서 직접 실행하세요:\n');
        console.log(`
-- Neon Auth users 테이블에서 이메일 동기화
UPDATE "User" u
SET email = au.email
FROM auth.users au
WHERE u."authUserId" = au.id
  AND u.email IS NULL;
        `);
        return;
    }

    // authUserId -> email 매핑
    const emailMap = new Map<string, string>();
    neonAuthUsers.forEach((user) => {
        emailMap.set(user.id, user.email);
    });

    // 3. 이메일 업데이트
    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of usersWithoutEmail) {
        const email = emailMap.get(user.authUserId);

        if (email) {
            await prisma.user.update({
                where: { userId: user.userId },
                data: { email },
            });
            console.log(`✅ ${user.name || user.userId}: ${email}`);
            updatedCount++;
        } else {
            console.log(`⚠️  ${user.name || user.userId}: Neon Auth에 이메일 없음`);
            skippedCount++;
        }
    }

    console.log(`\n=== 동기화 완료 ===`);
    console.log(`업데이트: ${updatedCount}명`);
    console.log(`건너뜀: ${skippedCount}명`);
}

// 스크립트 실행
syncUserEmails()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
