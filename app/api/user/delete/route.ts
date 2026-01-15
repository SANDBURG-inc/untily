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
            // 1. 제출자 역할 처리: userId로 연결된 모든 Submitter 익명화
            const submitters = await tx.submitter.findMany({
                where: { userId },
                select: { submitterId: true },
            });

            for (const submitter of submitters) {
                await tx.submitter.update({
                    where: { submitterId: submitter.submitterId },
                    data: {
                        name: '탈퇴한 사용자',
                        email: `deleted_${submitter.submitterId}@deleted.local`,
                        phone: '000-0000-0000',
                        userId: null,
                    },
                });
            }

            // 2. 관리자 역할 처리: DocumentBox 익명화 및 상태 변경
            // - userId 익명화 (삭제하지 않음)
            // - status를 CLOSED로 변경하여 제출 차단
            const timestamp = Date.now();
            await tx.documentBox.updateMany({
                where: { userId },
                data: {
                    userId: `DELETED_USER_${timestamp}`,
                    status: 'CLOSED',
                },
            });

            // 3. S3 파일 처리: 기본 로고만 삭제
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

            // 주의: 문서함 관련 데이터는 모두 보존
            // - Submitter, SubmittedDocument, RequiredDocument 등은 삭제하지 않음
            // - S3 제출 파일, 양식 파일, 문서함 로고는 삭제하지 않음
        });

        // S3에서 기본 로고만 삭제
        if (s3KeysToDelete.length > 0) {
            await deleteMultipleFromS3(s3KeysToDelete);
        }

        return NextResponse.json({
            success: true,
            message: 'User data anonymized successfully',
        });
    } catch (error) {
        console.error('Error anonymizing user data:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to anonymize user data' },
            { status: 500 }
        );
    }
}
