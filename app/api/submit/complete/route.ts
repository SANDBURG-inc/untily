import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // 1. Stack Auth 인증 확인
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 2. 요청 바디 파싱
    const { submitterId } = await request.json();

    if (!submitterId) {
      return NextResponse.json({ error: '제출자 ID가 필요합니다.' }, { status: 400 });
    }

    // 3. 제출자 검증
    const submitter = await prisma.submitter.findUnique({
      where: { submitterId },
      include: {
        documentBox: {
          include: { requiredDocuments: true },
        },
        submittedDocuments: true,
      },
    });

    if (!submitter) {
      return NextResponse.json({ error: '제출자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 4. 이메일 검증
    if (submitter.email.toLowerCase() !== user.primaryEmail?.toLowerCase()) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // 5. 만료 체크
    if (new Date() > submitter.documentBox.endDate) {
      return NextResponse.json({ error: '제출 기한이 만료되었습니다.' }, { status: 400 });
    }

    // 6. 이미 제출 완료 체크
    if (submitter.status === 'SUBMITTED') {
      return NextResponse.json({ error: '이미 제출이 완료되었습니다.' }, { status: 400 });
    }

    // 7. 필수 서류 업로드 완료 확인
    const requiredDocs = submitter.documentBox.requiredDocuments.filter((doc) => doc.isRequired);
    const uploadedRequiredDocIds = submitter.submittedDocuments.map((doc) => doc.requiredDocumentId);

    const missingDocs = requiredDocs.filter(
      (doc) => !uploadedRequiredDocIds.includes(doc.requiredDocumentId)
    );

    if (missingDocs.length > 0) {
      const missingNames = missingDocs.map((doc) => doc.documentTitle).join(', ');
      return NextResponse.json(
        { error: `필수 서류가 누락되었습니다: ${missingNames}` },
        { status: 400 }
      );
    }

    // 8. 제출 완료 처리
    await prisma.submitter.update({
      where: { submitterId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submit complete error:', error);
    return NextResponse.json(
      { error: '제출 완료 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
