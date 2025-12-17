import { NextRequest, NextResponse } from 'next/server';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import prisma from '@/lib/db';
import { deleteFromS3 } from '@/lib/s3/presigned';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: submittedDocumentId } = await params;

    // 1. Neon Auth 인증 확인
    const { user } = await neonAuth();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 2. 제출 서류 조회
    const submittedDocument = await prisma.submittedDocument.findUnique({
      where: { submittedDocumentId },
      include: {
        submitter: {
          include: { documentBox: true },
        },
      },
    });

    if (!submittedDocument) {
      return NextResponse.json({ error: '서류를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 3. 권한 체크 (제출자 본인만 삭제 가능)
    if (submittedDocument.submitter.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // 4. 이미 제출 완료된 경우 삭제 불가
    if (submittedDocument.submitter.status === 'SUBMITTED') {
      return NextResponse.json({ error: '이미 제출이 완료되어 삭제할 수 없습니다.' }, { status: 400 });
    }

    // 5. S3에서 파일 삭제
    try {
      await deleteFromS3(submittedDocument.s3Key);
    } catch (s3Error) {
      console.error('S3 deletion error:', s3Error);
      // S3 삭제 실패해도 DB 레코드는 삭제 진행
    }

    // 6. DB에서 레코드 삭제
    await prisma.submittedDocument.delete({
      where: { submittedDocumentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: '삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
