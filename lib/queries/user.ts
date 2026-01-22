/**
 * 사용자 관련 Prisma 쿼리 함수
 *
 * @module lib/queries/user
 */

import prisma from '@/lib/db';

interface AuthUserInfo {
    id: string;
    email: string;
    name?: string | null;
}

/**
 * 인증된 사용자의 User 레코드 조회 또는 생성
 *
 * - 기존 사용자: 이메일 동기화 후 반환
 * - 신규 사용자: User 레코드 생성 후 반환
 *
 * @param authUser Neon Auth에서 반환된 사용자 정보
 * @returns User 레코드
 */
export async function getOrCreateUser(authUser: AuthUserInfo) {
    const { id: authUserId, email, name } = authUser;

    // 기존 사용자 조회
    const existingUser = await prisma.user.findUnique({
        where: { authUserId },
    });

    if (existingUser) {
        // 이메일이 없거나 변경된 경우 동기화
        if (!existingUser.email || existingUser.email !== email) {
            return prisma.user.update({
                where: { userId: existingUser.userId },
                data: { email },
            });
        }
        return existingUser;
    }

    // 신규 사용자 생성 (이메일 포함)
    return prisma.user.create({
        data: {
            authUserId,
            email,
            name: name || null,
        },
    });
}

/**
 * 사용자 이메일 동기화
 *
 * 인증 세션에서 이메일이 있는 경우 User 테이블에 동기화합니다.
 * User 레코드가 없으면 생성합니다.
 *
 * @param authUserId Neon Auth 사용자 ID
 * @param email 이메일 주소
 */
export async function syncUserEmail(authUserId: string, email: string) {
    return prisma.user.upsert({
        where: { authUserId },
        update: { email },
        create: {
            authUserId,
            email,
        },
    });
}

/**
 * 사용자 ID로 이메일 조회
 *
 * DocumentBox 소유자의 이메일을 조회할 때 사용
 *
 * @param userId User 테이블의 userId
 * @returns 이메일 또는 null
 */
export async function getUserEmailByUserId(userId: string): Promise<string | null> {
    const user = await prisma.user.findFirst({
        where: { userId },
        select: { email: true },
    });
    return user?.email || null;
}

/**
 * Auth ID로 사용자 이메일 조회
 *
 * @param authUserId Neon Auth 사용자 ID
 * @returns 이메일 또는 null
 */
export async function getUserEmailByAuthId(authUserId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
        where: { authUserId },
        select: { email: true },
    });
    return user?.email || null;
}
