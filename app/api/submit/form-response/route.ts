import { NextRequest, NextResponse } from 'next/server';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import prisma from '@/lib/db';
import { hasDesignatedSubmitters } from '@/lib/utils/document-box';
import { isDocumentBoxClosed, type DocumentBoxStatus } from '@/lib/types/document';

/**
 * 폼 필드 응답 저장 API
 *
 * 제출자가 폼 필드에 입력한 값을 자동 저장합니다.
 * debounce와 함께 사용하여 입력 중 자동 저장됩니다.
 *
 * @route POST /api/submit/form-response
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Neon Auth 인증 확인
    const { user } = await neonAuth();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 2. 요청 바디 파싱
    const { documentBoxId, submitterId, formFieldId, value } = await request.json();

    if (!documentBoxId || !submitterId || !formFieldId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 3. 제출자 검증
    const submitter = await prisma.submitter.findUnique({
      where: { submitterId },
      include: {
        documentBox: true,
      },
    });

    if (!submitter) {
      return NextResponse.json({ error: '제출자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 4. 문서함 ID 일치 확인
    if (submitter.documentBoxId !== documentBoxId) {
      return NextResponse.json({ error: '잘못된 문서함입니다.' }, { status: 400 });
    }

    // 5. 권한 검증 (지정 제출자 vs 공개 제출)
    if (hasDesignatedSubmitters(submitter.documentBox.hasSubmitter)) {
      // 지정 제출자: 이메일 매칭 검증
      if (submitter.email.toLowerCase() !== user.email?.toLowerCase()) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
      }
    } else {
      // 공개 제출: userId 매칭 검증
      if (submitter.userId !== user.id) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
      }
    }

    // 6. 문서함 상태 확인
    if (isDocumentBoxClosed(submitter.documentBox.status as DocumentBoxStatus)) {
      return NextResponse.json({ error: '제출이 마감되었습니다.' }, { status: 400 });
    }

    // 7. 이미 제출 완료 체크
    if (submitter.status === 'SUBMITTED') {
      return NextResponse.json({ error: '이미 제출이 완료되었습니다.' }, { status: 400 });
    }

    // 8. 폼 필드 존재 확인
    const formField = await prisma.formField.findUnique({
      where: { formFieldId },
    });

    if (!formField) {
      return NextResponse.json({ error: '폼 필드를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 9. 폼 필드가 해당 문서함에 속하는지 확인
    if (formField.documentBoxId !== documentBoxId) {
      return NextResponse.json({ error: '잘못된 폼 필드입니다.' }, { status: 400 });
    }

    // 10. 폼 응답 upsert (있으면 수정, 없으면 생성)
    const formFieldResponse = await prisma.formFieldResponse.upsert({
      where: {
        formFieldId_submitterId: {
          formFieldId,
          submitterId,
        },
      },
      update: {
        value: value ?? '',
      },
      create: {
        formFieldId,
        submitterId,
        value: value ?? '',
      },
    });

    return NextResponse.json({
      success: true,
      formFieldResponseId: formFieldResponse.formFieldResponseId,
    });
  } catch (error) {
    console.error('Form response save error:', error);
    return NextResponse.json(
      { error: '폼 응답 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
