import { NextRequest, NextResponse } from 'next/server';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import prisma from '@/lib/db';
import { hasDesignatedSubmitters } from '@/lib/utils/document-box';

export async function POST(request: NextRequest) {
  try {
    // 1. Neon Auth 인증 확인
    const { user } = await neonAuth();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 2. 요청 바디 파싱
    const { submitterId, name, phone } = await request.json();

    if (!submitterId) {
      return NextResponse.json(
        { error: '제출자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: '성명을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (phone === undefined || phone === null) {
      return NextResponse.json(
        { error: '연락처 정보가 필요합니다.' },
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

    // 5. 제출 완료 상태 확인 - 제출 완료된 경우 수정 불가
    if (submitter.status === 'SUBMITTED') {
      return NextResponse.json(
        { error: '제출이 완료된 경우 정보를 수정할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 6. 제출자 정보 업데이트 (이메일은 수정 불가)
    const updatedSubmitter = await prisma.submitter.update({
      where: { submitterId },
      data: {
        name: name.trim(),
        phone: phone.trim(),
      },
    });

    return NextResponse.json({ success: true, data: updatedSubmitter });
  } catch (error) {
    console.error('Update submitter info error:', error);
    return NextResponse.json(
      { error: '제출자 정보 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
