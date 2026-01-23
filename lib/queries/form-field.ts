import prisma from '@/lib/db';
import type {
  FormFieldType,
  FormResponseViewData,
  SubmitterFormResponsesData,
} from '@/lib/types/form-field';

/**
 * 제출자의 폼 응답 조회 (관리자용)
 * 필드 → 응답 구조로 반환 (그룹 제거)
 *
 * @param documentBoxId 문서함 ID
 * @param submitterId 제출자 ID
 * @param userId 관리자 ID (권한 검증용)
 * @returns 폼 응답 데이터 또는 null (권한 없음/제출자 없음)
 */
export async function getSubmitterFormResponses(
  documentBoxId: string,
  submitterId: string,
  userId: string
): Promise<SubmitterFormResponsesData | null> {
  // 문서함 소유권 + 제출자 + 폼 필드 조회
  const documentBox = await prisma.documentBox.findUnique({
    where: { documentBoxId },
    select: {
      userId: true,
      submitters: {
        where: { submitterId },
        select: { submitterId: true, name: true },
      },
      formFields: {
        orderBy: { order: 'asc' },
        include: {
          responses: {
            where: { submitterId },
          },
        },
      },
    },
  });

  // 권한 검증
  if (!documentBox || documentBox.userId !== userId) {
    return null;
  }

  const submitter = documentBox.submitters[0];
  if (!submitter) {
    return null;
  }

  // 필드 → 응답 구조로 변환
  const fields: FormResponseViewData[] = documentBox.formFields.map(
    (field): FormResponseViewData => ({
      formFieldId: field.formFieldId,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType as FormFieldType,
      isRequired: field.isRequired,
      value: field.responses[0]?.value ?? null,
      // RADIO, CHECKBOX, DROPDOWN 타입일 때 선택지 포함
      options:
        ['RADIO', 'CHECKBOX', 'DROPDOWN'].includes(field.fieldType)
          ? ((field.options as string[] | null) ?? undefined)
          : undefined,
      hasOtherOption: field.hasOtherOption || undefined,
    })
  );

  // 응답 존재 여부 확인
  const hasResponses = fields.some((field) => field.value !== null);

  return {
    submitterId: submitter.submitterId,
    submitterName: submitter.name,
    fields,
    hasResponses,
  };
}

// ============================================================================
// CSV 내보내기용 타입
// ============================================================================

/** CSV 헤더 생성용 필드 정보 */
export interface FormFieldForExport {
  formFieldId: string;
  fieldLabel: string;
  fieldType: FormFieldType;
  order: number;
}

/** 제출자별 폼 응답 데이터 */
export interface SubmitterFormResponse {
  submitterId: string;
  name: string;
  email: string;
  phone: string | null;
  submittedAt: Date | null;
  responses: Map<string, string>; // formFieldId -> value
}

/** CSV 내보내기 결과 */
export interface FormResponsesExportData {
  boxTitle: string;
  fields: FormFieldForExport[];
  submitters: SubmitterFormResponse[];
}

// ============================================================================
// CSV 내보내기 쿼리
// ============================================================================

/**
 * CSV 내보내기용 폼 응답 데이터 조회
 * - 문서함 소유권 검증
 * - 폼 필드를 order 기준으로 정렬
 * - 제출자별 응답 매핑 (응답 없는 제출자도 포함)
 *
 * @param documentBoxId 문서함 ID
 * @param userId 현재 사용자 ID (소유권 검증용)
 * @returns FormResponsesExportData 또는 null (권한 없음/미존재)
 */
export async function getFormResponsesForExport(
  documentBoxId: string,
  userId: string
): Promise<FormResponsesExportData | null> {
  const documentBox = await prisma.documentBox.findUnique({
    where: { documentBoxId },
    include: {
      formFields: {
        orderBy: { order: 'asc' },
        include: {
          responses: {
            select: {
              value: true,
              submitterId: true,
            },
          },
        },
      },
      submitters: {
        where: {
          status: { in: ['SUBMITTED', 'REJECTED'] },
        },
        orderBy: { name: 'asc' },
        select: {
          submitterId: true,
          name: true,
          email: true,
          phone: true,
          submittedAt: true,
        },
      },
    },
  });

  // 권한 검증: 문서함 미존재 또는 소유자 불일치
  if (!documentBox || documentBox.userId !== userId) {
    return null;
  }

  // 필드 목록
  const fields: FormFieldForExport[] = documentBox.formFields.map((field) => ({
    formFieldId: field.formFieldId,
    fieldLabel: field.fieldLabel,
    fieldType: field.fieldType as FormFieldType,
    order: field.order,
  }));

  // 제출자별 응답 매핑
  const submitterResponseMap = new Map<string, Map<string, string>>();

  for (const field of documentBox.formFields) {
    for (const response of field.responses) {
      const { submitterId, value } = response;
      if (!submitterResponseMap.has(submitterId)) {
        submitterResponseMap.set(submitterId, new Map());
      }
      submitterResponseMap.get(submitterId)!.set(field.formFieldId, value);
    }
  }

  // 제출 경험이 있는 제출자(SUBMITTED/REJECTED)만 포함
  const submitters: SubmitterFormResponse[] = documentBox.submitters.map(s => ({
    submitterId: s.submitterId,
    name: s.name,
    email: s.email,
    phone: s.phone,
    submittedAt: s.submittedAt,
    responses: submitterResponseMap.get(s.submitterId) || new Map(),
  }));

  return {
    boxTitle: documentBox.boxTitle,
    fields,
    submitters,
  };
}
