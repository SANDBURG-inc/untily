import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateDownloadUrl } from '@/lib/s3/presigned';

/**
 * 양식 파일 다운로드용 Presigned URL 생성 API
 *
 * 제출자가 양식 파일을 다운로드할 때 사용
 * 인증 없이 접근 가능 (공개 제출 페이지에서 사용)
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

    // Presigned URL 생성 (파일명 포함해서 다운로드 강제)
    const downloadUrl = await generateDownloadUrl(s3Key, template.filename);

    return NextResponse.json({
      downloadUrl,
      filename: template.filename,
    });
  } catch (error) {
    console.error('Template download URL 생성 오류:', error);
    return NextResponse.json(
      { error: '다운로드 URL 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
