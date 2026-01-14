import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generatePreviewUrl } from '@/lib/s3/presigned';

/**
 * 양식 파일 미리보기용 Presigned URL 생성 API
 *
 * 관리자 대시보드에서 양식 파일 미리보기 시 사용
 * 인증 없이 접근 가능 (requiredDocumentId로 검증)
 *
 * Query params:
 * - s3Key: S3 키
 * - requiredDocumentId: 서류 ID (검증용)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const s3Key = searchParams.get('s3Key');
    const requiredDocumentId = searchParams.get('requiredDocumentId');

    // 필수 파라미터 검증
    if (!s3Key || !requiredDocumentId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 해당 서류가 존재하고 양식 파일이 일치하는지 검증
    const requiredDocument = await prisma.requiredDocument.findUnique({
      where: { requiredDocumentId },
      select: {
        templates: true,
      },
    });

    if (!requiredDocument) {
      return NextResponse.json(
        { error: '서류를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // templates JSON에서 해당 s3Key가 있는지 확인
    const templates = (requiredDocument.templates as Array<{ s3Key: string; filename: string }>) || [];
    const template = templates.find((t) => t.s3Key === s3Key);

    if (!template) {
      return NextResponse.json(
        { error: '유효하지 않은 요청입니다.' },
        { status: 403 }
      );
    }

    // 미리보기용 Presigned URL 생성 (inline으로 브라우저에서 직접 표시)
    const previewUrl = await generatePreviewUrl(s3Key);

    return NextResponse.json({
      previewUrl,
      filename: template.filename,
    });
  } catch (error) {
    console.error('Template preview URL 생성 오류:', error);
    return NextResponse.json(
      { error: '미리보기 URL 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
