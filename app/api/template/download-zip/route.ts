import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateDownloadUrl } from '@/lib/s3/presigned';
import { getZipFilename } from '@/lib/s3/zip';

/**
 * 양식 ZIP 파일 다운로드용 Presigned URL 생성 API
 *
 * 공개 제출 페이지에서 사용 (인증 불필요)
 * 양식이 2개 이상인 경우 미리 생성된 ZIP 파일 다운로드
 *
 * Query params:
 * - requiredDocumentId: 서류 ID
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const requiredDocumentId = searchParams.get('requiredDocumentId');

        if (!requiredDocumentId) {
            return NextResponse.json(
                { error: 'requiredDocumentId is required' },
                { status: 400 }
            );
        }

        // RequiredDocument 조회
        const requiredDocument = await prisma.requiredDocument.findUnique({
            where: { requiredDocumentId },
            include: {
                documentBox: {
                    select: { boxTitle: true },
                },
            },
        });

        if (!requiredDocument) {
            return NextResponse.json(
                { error: 'Required document not found' },
                { status: 404 }
            );
        }

        // ZIP 키 확인
        if (!requiredDocument.templateZipKey) {
            return NextResponse.json(
                { error: 'ZIP file not available. Use individual download instead.' },
                { status: 404 }
            );
        }

        // 파일명 생성: {문서함이름}-{서류이름}-양식.zip
        const filename = getZipFilename(
            requiredDocument.documentBox.boxTitle,
            requiredDocument.documentTitle
        );

        // Presigned URL 생성 (파일명 포함해서 다운로드 강제)
        const downloadUrl = await generateDownloadUrl(requiredDocument.templateZipKey, filename);

        return NextResponse.json({
            downloadUrl,
            filename,
        });
    } catch (error) {
        console.error('Template ZIP download error:', error);
        return NextResponse.json(
            { error: 'Failed to generate download URL' },
            { status: 500 }
        );
    }
}
