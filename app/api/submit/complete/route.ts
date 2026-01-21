import { NextRequest, NextResponse } from 'next/server';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import prisma from '@/lib/db';
import { hasDesignatedSubmitters } from '@/lib/utils/document-box';
import { isDocumentBoxClosed, type DocumentBoxStatus } from '@/lib/types/document';

export async function POST(request: NextRequest) {
  try {
    // 1. Neon Auth 인증 확인
    const { user } = await neonAuth();
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
          include: { requiredDocuments: { orderBy: { order: 'asc' } } },
        },
        submittedDocuments: true,
      },
    });

    if (!submitter) {
      return NextResponse.json({ error: '제출자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 4. 권한 검증 (지정 제출자 vs 공개 제출)
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

    // 5. 제출 가능 상태 체크 (status 기반)
    if (isDocumentBoxClosed(submitter.documentBox.status as DocumentBoxStatus)) {
      return NextResponse.json({ error: '제출이 마감되었습니다.' }, { status: 400 });
    }

    // 6. 이미 제출 완료 체크 (SUBMITTED 상태면 재제출 불가, REJECTED는 가능)
    if (submitter.status === 'SUBMITTED') {
      return NextResponse.json({ error: '이미 제출이 완료되었습니다.' }, { status: 400 });
    }

    // REJECTED 상태인지 확인 (재제출 로그 기록용)
    const isResubmission = submitter.status === 'REJECTED';

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

    // 8. 필수 폼 필드 응답 확인
    const requiredFields = await prisma.formField.findMany({
      where: {
        documentBoxId: submitter.documentBox.documentBoxId,
        isRequired: true,
      },
    });

    const formResponses = await prisma.formFieldResponse.findMany({
      where: { submitterId },
    });

    const responseMap = new Map(formResponses.map((r) => [r.formFieldId, r.value]));

    for (const field of requiredFields) {
      const response = responseMap.get(field.formFieldId);

      // 응답이 없거나 빈 값인 경우
      if (!response || response.trim() === '') {
        return NextResponse.json(
          { error: `필수 항목 "${field.fieldLabel}"을(를) 입력해주세요.` },
          { status: 400 }
        );
      }

      // CHECKBOX 타입에서 필수 복수선택 검증 (기타 포함 시 기타값도 체크)
      if (field.fieldType === 'CHECKBOX') {
        // 단순 동의 체크박스 (options이 없거나 빈 배열인 경우)
        const options = field.options as string[] | null;
        if (!options || options.length === 0) {
          if (response !== 'true') {
            return NextResponse.json(
              { error: `"${field.fieldLabel}" 동의가 필요합니다.` },
              { status: 400 }
            );
          }
        }
        // 복수선택 체크박스는 값이 있으면 통과 (위에서 빈 값 체크 완료)
      }
    }

    // 9. 제출 완료 처리
    if (isResubmission) {
      // 재제출인 경우: ResubmissionLog 생성 + 상태 변경 (트랜잭션)
      await prisma.$transaction([
        prisma.resubmissionLog.create({
          data: {
            submitterId,
            resubmittedAt: new Date(),
          },
        }),
        prisma.submitter.update({
          where: { submitterId },
          data: {
            status: 'SUBMITTED',
            submittedAt: new Date(),
            userId: user.id,
            isChecked: false, // 재제출 시 확인 상태 초기화
          },
        }),
      ]);
    } else {
      // 최초 제출
      await prisma.submitter.update({
        where: { submitterId },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          userId: user.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submit complete error:', error);
    return NextResponse.json(
      { error: '제출 완료 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
