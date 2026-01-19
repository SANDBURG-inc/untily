import { NextRequest, NextResponse } from 'next/server';
import { ensureAuthenticated } from '@/lib/auth';
import {
  getFormResponsesForExport,
  type FormResponsesExportData,
} from '@/lib/queries/form-field';
import { formatCheckboxValue } from '@/lib/types/form-field';

/**
 * 문서함의 폼 응답을 CSV로 내보내기
 * GET /api/document-box/[id]/responses/export
 *
 * CSV 형식:
 * - 헤더: 제출자명, 이메일, 연락처, [폼 필드 레이블들...], 제출일
 * - BOM 포함 (Excel 한글 호환)
 * - CHECKBOX 값은 한글로 변환 (동의함/동의 안함)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await ensureAuthenticated();
    const { id: documentBoxId } = await params;

    // 폼 응답 데이터 조회 (권한 검증 포함)
    const data = await getFormResponsesForExport(documentBoxId, user.id);

    if (!data) {
      return NextResponse.json(
        { error: '문서함을 찾을 수 없거나 접근 권한이 없습니다.' },
        { status: 404 }
      );
    }

    // 폼 필드가 없는 경우
    if (data.fields.length === 0) {
      return NextResponse.json(
        { error: '내보낼 폼 응답이 없습니다. 폼 필드가 설정되지 않았습니다.' },
        { status: 400 }
      );
    }

    // CSV 생성
    const csvContent = generateCsvContent(data);

    // 파일명 생성 (특수문자 제거)
    const sanitizedTitle = data.boxTitle.replace(/[<>:"/\\|?*]/g, '_');
    const filename = `${sanitizedTitle}_폼응답.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    console.error('Form responses export error:', error);
    return NextResponse.json(
      { error: 'CSV 내보내기 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * CSV 콘텐츠 생성
 * - BOM 포함 (Excel 한글 호환)
 * - 헤더: 제출자명, 이메일, 연락처, [폼 필드들], 제출일
 * - CHECKBOX 값은 한글로 변환
 */
function generateCsvContent(data: FormResponsesExportData): string {
  // BOM: Excel에서 한글이 깨지지 않도록
  const BOM = '\uFEFF';

  // 헤더 생성
  const headers = [
    '제출자명',
    '이메일',
    '연락처',
    ...data.fields.map((f) => f.fieldLabel),
    '제출일',
  ];

  // 행 생성
  const rows = data.submitters.map((submitter) => {
    const fieldValues = data.fields.map((field) => {
      const value = submitter.responses.get(field.formFieldId) || '';
      // CHECKBOX 타입은 한글로 변환
      if (field.fieldType === 'CHECKBOX') {
        return formatCheckboxValue(value);
      }
      return value;
    });

    return [
      submitter.name,
      submitter.email,
      submitter.phone || '',
      ...fieldValues,
      submitter.submittedAt
        ? new Date(submitter.submittedAt).toLocaleString('ko-KR')
        : '',
    ];
  });

  // CSV 문자열 생성
  const csvLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];

  return BOM + csvLines.join('\n');
}

/**
 * CSV 셀 이스케이프
 * - 쌍따옴표로 감싸고, 내부 쌍따옴표는 두 번 반복
 */
function escapeCell(cell: string): string {
  return `"${cell.replace(/"/g, '""')}"`;
}
