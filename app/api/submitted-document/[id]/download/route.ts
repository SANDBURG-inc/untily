import { NextRequest, NextResponse } from 'next/server';
import { ensureAuthenticated } from '@/lib/auth';
import { getSubmittedFileById } from '@/lib/queries/document-box';
import { generateDownloadUrl } from '@/lib/s3/presigned';

/**
 * 제출 파일 다운로드 URL 조회
 * GET /api/submitted-document/[id]/download?documentBoxId=xxx
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await ensureAuthenticated();
        const { id: submittedDocumentId } = await params;
        const documentBoxId = request.nextUrl.searchParams.get('documentBoxId');

        if (!documentBoxId) {
            return NextResponse.json(
                { error: 'documentBoxId가 필요합니다.' },
                { status: 400 }
            );
        }

        const file = await getSubmittedFileById(documentBoxId, submittedDocumentId, user.id);

        if (!file) {
            return NextResponse.json(
                { error: '파일을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        const downloadUrl = await generateDownloadUrl(file.s3Key, file.filename);

        return NextResponse.json({
            downloadUrl,
            filename: file.filename
        });
    } catch (error) {
        console.error('Get download URL error:', error);
        return NextResponse.json(
            { error: '다운로드 URL 생성 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
