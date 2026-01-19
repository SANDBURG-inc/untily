import { NextRequest, NextResponse } from 'next/server';
import { ensureAuthenticated } from '@/lib/auth';
import { getSubmitterFormResponses } from '@/lib/queries/form-field';

/**
 * 제출자별 폼 응답 조회
 * GET /api/document-box/[id]/submitter/[submitterId]/responses
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submitterId: string }> }
) {
  try {
    const user = await ensureAuthenticated();
    const { id: documentBoxId, submitterId } = await params;

    const result = await getSubmitterFormResponses(
      documentBoxId,
      submitterId,
      user.id
    );

    if (!result) {
      return NextResponse.json(
        { error: '제출자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get submitter form responses error:', error);
    return NextResponse.json(
      { error: '폼 응답 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
