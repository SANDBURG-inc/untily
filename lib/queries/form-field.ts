import prisma from '@/lib/db';
import type {
  FormFieldType,
  FormResponseViewData,
  FormResponseGroupViewData,
  SubmitterFormResponsesData,
} from '@/lib/types/form-field';

/**
 * 제출자의 폼 응답 조회 (관리자용)
 * 그룹 → 필드 → 응답 구조로 반환
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
  // 문서함 소유권 + 제출자 + 폼 필드 그룹 조회
  const documentBox = await prisma.documentBox.findUnique({
    where: { documentBoxId },
    select: {
      userId: true,
      submitters: {
        where: { submitterId },
        select: { submitterId: true, name: true },
      },
      formFieldGroups: {
        orderBy: { order: 'asc' },
        include: {
          formFields: {
            orderBy: { order: 'asc' },
            include: {
              responses: {
                where: { submitterId },
              },
            },
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

  // 그룹 → 필드 → 응답 구조로 변환
  const groups: FormResponseGroupViewData[] = documentBox.formFieldGroups.map(
    (group) => ({
      formFieldGroupId: group.formFieldGroupId,
      groupTitle: group.groupTitle,
      groupDescription: group.groupDescription ?? undefined,
      isRequired: group.isRequired,
      fields: group.formFields.map((field): FormResponseViewData => ({
        formFieldId: field.formFieldId,
        fieldLabel: field.fieldLabel,
        fieldType: field.fieldType as FormFieldType,
        isRequired: field.isRequired,
        value: field.responses[0]?.value ?? null,
        // RADIO 타입일 때만 선택지 포함
        options:
          field.fieldType === 'RADIO'
            ? ((field.options as string[] | null) ?? undefined)
            : undefined,
      })),
    })
  );

  // 응답 존재 여부 확인
  const hasResponses = groups.some((group) =>
    group.fields.some((field) => field.value !== null)
  );

  return {
    submitterId: submitter.submitterId,
    submitterName: submitter.name,
    groups,
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
  groupTitle: string;
  order: number; // 필드 순서
  groupOrder: number; // 그룹 순서
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
 * - 폼 필드 그룹/필드를 order 기준으로 정렬
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
      formFieldGroups: {
        orderBy: { order: 'asc' },
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
        },
      },
      submitters: {
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

  // 필드 목록 평탄화 (그룹 order → 필드 order 순서)
  const fields: FormFieldForExport[] = [];
  for (const group of documentBox.formFieldGroups) {
    for (const field of group.formFields) {
      fields.push({
        formFieldId: field.formFieldId,
        fieldLabel: field.fieldLabel,
        fieldType: field.fieldType as FormFieldType,
        groupTitle: group.groupTitle,
        order: field.order,
        groupOrder: group.order,
      });
    }
  }

  // 제출자별 응답 매핑
  const submitterResponseMap = new Map<string, Map<string, string>>();

  for (const group of documentBox.formFieldGroups) {
    for (const field of group.formFields) {
      for (const response of field.responses) {
        const { submitterId, value } = response;
        if (!submitterResponseMap.has(submitterId)) {
          submitterResponseMap.set(submitterId, new Map());
        }
        submitterResponseMap.get(submitterId)!.set(field.formFieldId, value);
      }
    }
  }

  // 제출자 목록 구성 (응답이 없는 제출자도 포함)
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
