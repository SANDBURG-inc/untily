// ============================================================================
// 폼 필드 타입 (정보 입력 항목)
// ============================================================================

// 폼 필드 타입 (Prisma enum과 동일하게 정의)
export type FormFieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'EMAIL'
  | 'TEL'
  | 'DATE'
  | 'CHECKBOX'
  | 'RADIO';

// 폼 필드 타입 레이블 매핑
export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  TEXT: '텍스트',
  TEXTAREA: '긴 텍스트',
  EMAIL: '이메일',
  TEL: '전화번호',
  DATE: '날짜',
  CHECKBOX: '체크박스',
  RADIO: '선택 (라디오)',
};

// 폼 필드 타입별 설명
export const FORM_FIELD_TYPE_DESCRIPTIONS: Record<FormFieldType, string> = {
  TEXT: '한 줄 텍스트 입력',
  TEXTAREA: '여러 줄 텍스트 입력',
  EMAIL: '이메일 형식 검증 포함',
  TEL: '전화번호 형식 검증 포함',
  DATE: '날짜 선택기',
  CHECKBOX: '동의 여부 등 단일 체크박스',
  RADIO: '여러 선택지 중 하나 선택',
};

// 폼 필드 타입별 기본 플레이스홀더
export const FORM_FIELD_TYPE_PLACEHOLDERS: Record<FormFieldType, string> = {
  TEXT: '텍스트를 입력하세요',
  TEXTAREA: '내용을 입력하세요',
  EMAIL: 'example@email.com',
  TEL: '010-1234-5678',
  DATE: '날짜를 선택하세요',
  CHECKBOX: '위 내용에 동의합니다',
  RADIO: '하나를 선택하세요',
};

// 선택지가 필요한 필드 타입인지 확인
export function requiresOptions(fieldType: FormFieldType): boolean {
  return fieldType === 'RADIO';
}

// 유효성 검사가 필요한 필드 타입인지 확인
export function hasBuiltInValidation(fieldType: FormFieldType): boolean {
  return fieldType === 'EMAIL' || fieldType === 'TEL';
}

// ============================================================================
// 폼 필드 데이터 인터페이스
// ============================================================================

/** 폼 필드 정의 (관리자가 생성) */
export interface FormFieldData {
  id: string;
  fieldLabel: string;
  fieldType: FormFieldType;
  placeholder?: string;
  isRequired: boolean;
  order: number;
  options?: string[]; // radio용 선택지
  validation?: FormFieldValidation;
}

/** 폼 필드 유효성 검사 규칙 */
export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
}

/** 폼 필드 그룹 (관리자가 생성) */
export interface FormFieldGroupData {
  id: string;
  groupTitle: string;
  groupDescription?: string;
  isRequired: boolean;
  order: number;
  fields: FormFieldData[];
}

/** 폼 필드 응답 (제출자가 입력) */
export interface FormFieldResponseData {
  formFieldId: string;
  value: string;
}

// ============================================================================
// API Request/Response 타입
// ============================================================================

/** 폼 필드 그룹 생성 요청 (문서함 생성 시 포함) */
export interface CreateFormFieldGroupRequest {
  groupTitle: string;
  groupDescription?: string;
  isRequired: boolean;
  order: number;
  fields: {
    fieldLabel: string;
    fieldType: FormFieldType;
    placeholder?: string;
    isRequired: boolean;
    order: number;
    options?: string[];
    validation?: FormFieldValidation;
  }[];
}

/** 폼 응답 저장 요청 (자동 저장용) */
export interface SaveFormResponseRequest {
  documentBoxId: string;
  submitterId: string;
  formFieldId: string;
  value: string;
}

/** 폼 응답 저장 응답 */
export interface SaveFormResponseResponse {
  success: boolean;
  formFieldResponseId: string;
}

// ============================================================================
// 관리자 조회용 타입 (Phase 4)
// ============================================================================

/** 제출자의 단일 폼 응답 (조회용) */
export interface FormResponseViewData {
  formFieldId: string;
  fieldLabel: string;
  fieldType: FormFieldType;
  isRequired: boolean;
  value: string | null; // 미응답 시 null
  options?: string[]; // RADIO 타입일 때 선택지 목록
}

/** 폼 필드 그룹 + 응답 (조회용) */
export interface FormResponseGroupViewData {
  formFieldGroupId: string;
  groupTitle: string;
  groupDescription?: string;
  isRequired: boolean;
  fields: FormResponseViewData[];
}

/** API 응답: GET /api/document-box/[id]/submitter/[submitterId]/responses */
export interface SubmitterFormResponsesData {
  submitterId: string;
  submitterName: string;
  groups: FormResponseGroupViewData[];
  hasResponses: boolean; // 응답이 하나라도 있는지
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 폼 필드 값의 유효성 검사
 * @param fieldType 필드 타입
 * @param value 입력값
 * @param isRequired 필수 여부
 * @param validation 추가 검증 규칙
 * @returns 에러 메시지 또는 null
 */
export function validateFormFieldValue(
  fieldType: FormFieldType,
  value: string,
  isRequired: boolean,
  validation?: FormFieldValidation
): string | null {
  // 필수 필드 체크
  if (isRequired && (!value || value.trim() === '')) {
    return '필수 항목입니다.';
  }

  // 값이 없으면 이후 검증 스킵
  if (!value || value.trim() === '') {
    return null;
  }

  // 타입별 검증
  switch (fieldType) {
    case 'EMAIL': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return '올바른 이메일 형식이 아닙니다.';
      }
      break;
    }
    case 'TEL': {
      const telRegex = /^[\d\-+() ]+$/;
      if (!telRegex.test(value)) {
        return '올바른 전화번호 형식이 아닙니다.';
      }
      break;
    }
    case 'DATE': {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        return '올바른 날짜 형식이 아닙니다. (YYYY-MM-DD)';
      }
      break;
    }
    case 'CHECKBOX': {
      if (isRequired && value !== 'true') {
        return '동의가 필요합니다.';
      }
      break;
    }
  }

  // 추가 검증 규칙 적용
  if (validation) {
    if (validation.minLength && value.length < validation.minLength) {
      return `최소 ${validation.minLength}자 이상 입력해주세요.`;
    }
    if (validation.maxLength && value.length > validation.maxLength) {
      return `최대 ${validation.maxLength}자까지 입력 가능합니다.`;
    }
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return validation.patternMessage || '입력 형식이 올바르지 않습니다.';
      }
    }
  }

  return null;
}

/**
 * 필수 폼 필드 그룹의 완료 여부 확인
 * @param groups 폼 필드 그룹 목록
 * @param responses 제출된 응답 목록
 * @returns 미완료 필드 정보 배열
 */
export function getIncompleteFormFields(
  groups: FormFieldGroupData[],
  responses: FormFieldResponseData[]
): { groupTitle: string; fieldLabel: string }[] {
  const responseMap = new Map(responses.map(r => [r.formFieldId, r.value]));
  const incomplete: { groupTitle: string; fieldLabel: string }[] = [];

  for (const group of groups) {
    if (!group.isRequired) continue;

    for (const field of group.fields) {
      if (!field.isRequired) continue;

      const response = responseMap.get(field.id);
      const error = validateFormFieldValue(
        field.fieldType,
        response || '',
        true
      );

      if (error) {
        incomplete.push({
          groupTitle: group.groupTitle,
          fieldLabel: field.fieldLabel,
        });
      }
    }
  }

  return incomplete;
}

/**
 * 폼 필드 그룹의 완료율 계산
 * @param groups 폼 필드 그룹 목록
 * @param responses 제출된 응답 목록
 * @returns 완료율 (0-100)
 */
export function calculateFormCompletionRate(
  groups: FormFieldGroupData[],
  responses: FormFieldResponseData[]
): number {
  const responseMap = new Map(responses.map(r => [r.formFieldId, r.value]));

  let totalRequired = 0;
  let completedRequired = 0;

  for (const group of groups) {
    for (const field of group.fields) {
      if (!field.isRequired) continue;

      totalRequired++;
      const response = responseMap.get(field.id);
      const error = validateFormFieldValue(
        field.fieldType,
        response || '',
        true
      );

      if (!error) {
        completedRequired++;
      }
    }
  }

  if (totalRequired === 0) return 100;
  return Math.round((completedRequired / totalRequired) * 100);
}

// ============================================================================
// CSV 내보내기용 유틸리티
// ============================================================================

/**
 * CHECKBOX 값을 한글로 포맷팅 (CSV 내보내기용)
 * @param value 응답 값 ('true', 'false', '')
 * @returns '동의함', '동의 안함', ''
 */
export function formatCheckboxValue(value: string): string {
  if (value === 'true') return '동의함';
  if (value === 'false') return '동의 안함';
  return '';
}
