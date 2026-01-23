// ============================================================================
// 폼 필드 타입 (정보 입력 항목)
// 구글 폼 스타일 리팩토링 - 그룹 제거, 개별 질문 카드 UI
// ============================================================================

import type { LucideIcon } from 'lucide-react';
import {
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  ChevronDown,
  Calendar,
  Clock,
} from 'lucide-react';

// ============================================================================
// UI 선택용 질문 타입 (QuestionType)
// - 사용자가 질문 유형을 선택할 때 표시되는 타입
// - 아이콘과 함께 드롭다운에 표시
// ============================================================================

export type QuestionType =
  | 'SHORT_TEXT'    // 단답형
  | 'LONG_TEXT'     // 장문형
  | 'SINGLE_CHOICE' // 객관식 (1개 선택)
  | 'MULTI_CHOICE'  // 체크박스 (복수 선택)
  | 'DROPDOWN'      // 드롭다운 (1개 선택)
  | 'DATE'          // 날짜
  | 'TIME';         // 시간

// 단답형 서브타입 (SHORT_TEXT의 세부 유형)
export type ShortTextSubType = 'TEXT' | 'EMAIL' | 'TEL';

// 질문 타입 정보 (UI 표시용)
export interface QuestionTypeInfo {
  label: string;
  description: string;
  icon: LucideIcon;
  hasSubType?: boolean;    // 서브타입이 있는지 (SHORT_TEXT만 true)
  hasOptions?: boolean;    // 선택지가 필요한지
  canHaveOther?: boolean;  // '기타' 옵션 가능 여부
}

export const QUESTION_TYPE_INFO: Record<QuestionType, QuestionTypeInfo> = {
  SHORT_TEXT: {
    label: '단답형',
    description: '한 줄 텍스트 입력',
    icon: Type,
    hasSubType: true,
  },
  LONG_TEXT: {
    label: '장문형',
    description: '여러 줄 텍스트 입력',
    icon: AlignLeft,
  },
  SINGLE_CHOICE: {
    label: '객관식',
    description: '여러 선택지 중 1개 선택',
    icon: CircleDot,
    hasOptions: true,
    canHaveOther: true,
  },
  MULTI_CHOICE: {
    label: '체크박스',
    description: '여러 선택지 중 복수 선택',
    icon: CheckSquare,
    hasOptions: true,
    canHaveOther: true,
  },
  DROPDOWN: {
    label: '드롭다운',
    description: '드롭다운 목록에서 1개 선택',
    icon: ChevronDown,
    hasOptions: true,
  },
  DATE: {
    label: '날짜',
    description: '날짜 선택',
    icon: Calendar,
  },
  TIME: {
    label: '시간',
    description: '시간 선택',
    icon: Clock,
  },
};

// 단답형 서브타입 정보
export const SHORT_TEXT_SUBTYPE_INFO: Record<ShortTextSubType, { label: string; placeholder: string }> = {
  TEXT: {
    label: '텍스트',
    placeholder: '내 답변',
  },
  EMAIL: {
    label: '이메일',
    placeholder: 'example@email.com',
  },
  TEL: {
    label: '전화번호',
    placeholder: '010-1234-5678',
  },
};

// ============================================================================
// DB 저장용 필드 타입 (FormFieldType)
// - Prisma 스키마와 동일하게 정의
// - 실제 데이터베이스에 저장되는 타입
// ============================================================================

export type FormFieldType =
  | 'TEXT'      // 단답형 텍스트
  | 'TEXTAREA'  // 장문형
  | 'EMAIL'     // 이메일 (단답형 서브타입)
  | 'TEL'       // 전화번호 (단답형 서브타입)
  | 'RADIO'     // 객관식 (1개 선택)
  | 'CHECKBOX'  // 체크박스 (복수 선택)
  | 'DROPDOWN'  // 드롭다운
  | 'DATE'      // 날짜
  | 'TIME';     // 시간

// 폼 필드 타입 레이블 매핑 (기존 호환성 유지)
export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  TEXT: '단답형',
  TEXTAREA: '장문형',
  EMAIL: '이메일',
  TEL: '전화번호',
  RADIO: '객관식',
  CHECKBOX: '체크박스',
  DROPDOWN: '드롭다운',
  DATE: '날짜',
  TIME: '시간',
};

// 폼 필드 타입별 기본 플레이스홀더
export const FORM_FIELD_TYPE_PLACEHOLDERS: Record<FormFieldType, string> = {
  TEXT: '내 답변',
  TEXTAREA: '내용을 입력하세요',
  EMAIL: 'example@email.com',
  TEL: '010-1234-5678',
  RADIO: '하나를 선택하세요',
  CHECKBOX: '해당하는 항목을 모두 선택하세요',
  DROPDOWN: '선택하세요',
  DATE: '날짜를 선택하세요',
  TIME: '시간을 선택하세요',
};

// ============================================================================
// 타입 변환 유틸리티
// ============================================================================

/**
 * QuestionType → FormFieldType 변환
 * @param questionType UI에서 선택한 질문 타입
 * @param subType 단답형의 경우 서브타입 (TEXT, EMAIL, TEL)
 */
export function questionTypeToFieldType(
  questionType: QuestionType,
  subType?: ShortTextSubType
): FormFieldType {
  switch (questionType) {
    case 'SHORT_TEXT':
      return subType || 'TEXT';
    case 'LONG_TEXT':
      return 'TEXTAREA';
    case 'SINGLE_CHOICE':
      return 'RADIO';
    case 'MULTI_CHOICE':
      return 'CHECKBOX';
    case 'DROPDOWN':
      return 'DROPDOWN';
    case 'DATE':
      return 'DATE';
    case 'TIME':
      return 'TIME';
    default:
      return 'TEXT';
  }
}

/**
 * FormFieldType → QuestionType 변환
 * @param fieldType DB에 저장된 필드 타입
 * @returns [QuestionType, ShortTextSubType | undefined]
 */
export function fieldTypeToQuestionType(
  fieldType: FormFieldType
): [QuestionType, ShortTextSubType | undefined] {
  switch (fieldType) {
    case 'TEXT':
      return ['SHORT_TEXT', 'TEXT'];
    case 'EMAIL':
      return ['SHORT_TEXT', 'EMAIL'];
    case 'TEL':
      return ['SHORT_TEXT', 'TEL'];
    case 'TEXTAREA':
      return ['LONG_TEXT', undefined];
    case 'RADIO':
      return ['SINGLE_CHOICE', undefined];
    case 'CHECKBOX':
      return ['MULTI_CHOICE', undefined];
    case 'DROPDOWN':
      return ['DROPDOWN', undefined];
    case 'DATE':
      return ['DATE', undefined];
    case 'TIME':
      return ['TIME', undefined];
    default:
      return ['SHORT_TEXT', 'TEXT'];
  }
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 선택지가 필요한 필드 타입인지 확인
 */
export function requiresOptions(fieldType: FormFieldType): boolean {
  return fieldType === 'RADIO' || fieldType === 'CHECKBOX' || fieldType === 'DROPDOWN';
}

/**
 * 선택지가 필요한 질문 타입인지 확인
 */
export function questionRequiresOptions(questionType: QuestionType): boolean {
  return questionType === 'SINGLE_CHOICE' || questionType === 'MULTI_CHOICE' || questionType === 'DROPDOWN';
}

/**
 * '기타' 옵션이 가능한 타입인지 확인
 */
export function canHaveOtherOption(fieldType: FormFieldType): boolean {
  return fieldType === 'RADIO' || fieldType === 'CHECKBOX';
}

/**
 * 유효성 검사가 필요한 필드 타입인지 확인
 */
export function hasBuiltInValidation(fieldType: FormFieldType): boolean {
  return fieldType === 'EMAIL' || fieldType === 'TEL';
}

// ============================================================================
// '기타' 옵션 관련 유틸리티
// ============================================================================

// 복수 선택 값 구분자 (옵션 텍스트에 쉼표 포함 가능하므로 특수 구분자 사용)
export const MULTI_CHOICE_SEPARATOR = '|||';

// '기타' 옵션 선택 시 값 prefix
export const OTHER_OPTION_PREFIX = '__OTHER__:';

/**
 * '기타' 옵션이 선택되었는지 확인
 */
export function isOtherOptionSelected(value: string): boolean {
  return value.startsWith(OTHER_OPTION_PREFIX);
}

/**
 * '기타' 옵션의 사용자 입력값 추출
 */
export function extractOtherValue(value: string): string {
  if (isOtherOptionSelected(value)) {
    return value.slice(OTHER_OPTION_PREFIX.length);
  }
  return '';
}

/**
 * '기타' 옵션 값 생성
 */
export function createOtherValue(userInput: string): string {
  return `${OTHER_OPTION_PREFIX}${userInput}`;
}

/**
 * 복수 선택(CHECKBOX) 응답에서 '기타' 값 파싱
 * 새 형식: "옵션1|||옵션2|||__OTHER__:사용자입력"
 * 기존 형식(fallback): "옵션1,옵션2,__OTHER__:사용자입력"
 */
export function parseMultiChoiceValue(value: string): {
  selectedOptions: string[];
  otherValue: string | null;
} {
  if (!value) {
    return { selectedOptions: [], otherValue: null };
  }

  // 새 구분자가 포함되어 있으면 새 방식으로 파싱, 아니면 쉼표 fallback
  const separator = value.includes(MULTI_CHOICE_SEPARATOR) ? MULTI_CHOICE_SEPARATOR : ',';
  const parts = value.split(separator);
  const selectedOptions: string[] = [];
  let otherValue: string | null = null;

  for (const part of parts) {
    if (isOtherOptionSelected(part)) {
      otherValue = extractOtherValue(part);
    } else if (part) {
      selectedOptions.push(part);
    }
  }

  return { selectedOptions, otherValue };
}

/**
 * 복수 선택(CHECKBOX) 응답 값 생성
 * 구분자: '|||' (옵션 텍스트에 쉼표 포함 가능)
 */
export function createMultiChoiceValue(
  selectedOptions: string[],
  otherValue?: string | null
): string {
  const parts = [...selectedOptions];
  // otherValue가 null/undefined가 아니면 추가 (빈 문자열도 '기타' 체크 상태로 간주)
  if (otherValue !== null && otherValue !== undefined) {
    parts.push(createOtherValue(otherValue));
  }
  return parts.join(MULTI_CHOICE_SEPARATOR);
}

// ============================================================================
// 폼 필드 데이터 인터페이스
// ============================================================================

/** 폼 필드 정의 (관리자가 생성) - 새 구조 */
export interface FormFieldData {
  id: string;
  fieldLabel: string;
  fieldType: FormFieldType;
  placeholder?: string;
  description?: string;      // 질문 설명 (새로 추가)
  isRequired: boolean;
  order: number;
  options?: string[];        // 선택지 배열
  hasOtherOption?: boolean;  // '기타' 옵션 활성화 (새로 추가)
  validation?: FormFieldValidation;
}

/** 폼 필드 유효성 검사 규칙 */
export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
}

/** 폼 필드 응답 (제출자가 입력) */
export interface FormFieldResponseData {
  formFieldId: string;
  value: string;
}

// ============================================================================
// [Deprecated] 그룹 관련 타입 - 기존 호환성 유지
// 새 코드에서는 사용하지 않음, 마이그레이션 완료 후 삭제 예정
// ============================================================================

/** @deprecated FormFieldGroup 제거됨 - 마이그레이션 후 삭제 */
export interface FormFieldGroupData {
  id: string;
  groupTitle: string;
  groupDescription?: string;
  isRequired: boolean;
  order: number;
  fields: FormFieldData[];
}

/** @deprecated FormFieldGroup 제거됨 - 마이그레이션 후 삭제 */
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

// ============================================================================
// API Request/Response 타입
// ============================================================================

/** 폼 필드 생성 요청 (문서함 생성 시 포함) - 새 구조 */
export interface CreateFormFieldRequest {
  fieldLabel: string;
  fieldType: FormFieldType;
  placeholder?: string;
  description?: string;
  isRequired: boolean;
  order: number;
  options?: string[];
  hasOtherOption?: boolean;
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
// 관리자 조회용 타입
// ============================================================================

/** 제출자의 단일 폼 응답 (조회용) */
export interface FormResponseViewData {
  formFieldId: string;
  fieldLabel: string;
  fieldType: FormFieldType;
  isRequired: boolean;
  value: string | null;
  options?: string[];
  hasOtherOption?: boolean;
}

/** @deprecated FormFieldGroup 제거됨 */
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
  fields: FormResponseViewData[];  // 그룹 없이 필드 직접 반환
  /** @deprecated 그룹 구조 - 마이그레이션 후 삭제 */
  groups?: FormResponseGroupViewData[];
  hasResponses: boolean;
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

  // '기타' 옵션 선택 시 입력값 검증
  if (isOtherOptionSelected(value)) {
    const otherInput = extractOtherValue(value);
    if (isRequired && !otherInput.trim()) {
      return '기타 항목을 입력해주세요.';
    }
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
    case 'TIME': {
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(value)) {
        return '올바른 시간 형식이 아닙니다. (HH:MM)';
      }
      break;
    }
    case 'CHECKBOX': {
      // 복수 선택의 경우 필수 체크
      if (isRequired) {
        const { selectedOptions, otherValue } = parseMultiChoiceValue(value);
        if (selectedOptions.length === 0 && !otherValue) {
          return '하나 이상 선택해주세요.';
        }
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
 * 필수 폼 필드의 완료 여부 확인 (새 구조 - 그룹 없음)
 * @param fields 폼 필드 목록
 * @param responses 제출된 응답 목록
 * @returns 미완료 필드 정보 배열
 */
export function getIncompleteFormFields(
  fields: FormFieldData[],
  responses: FormFieldResponseData[]
): { fieldLabel: string }[] {
  const responseMap = new Map(responses.map(r => [r.formFieldId, r.value]));
  const incomplete: { fieldLabel: string }[] = [];

  for (const field of fields) {
    if (!field.isRequired) continue;

    const response = responseMap.get(field.id);
    const error = validateFormFieldValue(
      field.fieldType,
      response || '',
      true
    );

    if (error) {
      incomplete.push({ fieldLabel: field.fieldLabel });
    }
  }

  return incomplete;
}

/**
 * 폼 필드의 완료율 계산 (새 구조 - 그룹 없음)
 * @param fields 폼 필드 목록
 * @param responses 제출된 응답 목록
 * @returns 완료율 (0-100)
 */
export function calculateFormCompletionRate(
  fields: FormFieldData[],
  responses: FormFieldResponseData[]
): number {
  const responseMap = new Map(responses.map(r => [r.formFieldId, r.value]));

  let totalRequired = 0;
  let completedRequired = 0;

  for (const field of fields) {
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

  if (totalRequired === 0) return 100;
  return Math.round((completedRequired / totalRequired) * 100);
}

// ============================================================================
// CSV 내보내기용 유틸리티
// ============================================================================

/**
 * CHECKBOX 값을 한글로 포맷팅 (CSV 내보내기용 - 복수선택 대응)
 */
export function formatCheckboxValue(value: string, options?: string[]): string {
  if (!value) return '';

  // 복수 선택 파싱
  const { selectedOptions, otherValue } = parseMultiChoiceValue(value);

  if (selectedOptions.length === 0 && !otherValue) {
    return '';
  }

  const parts = [...selectedOptions];
  if (otherValue) {
    parts.push(`기타: ${otherValue}`);
  }

  return parts.join(', ');
}

/**
 * 단일 선택(RADIO) 값 포맷팅 (기타 옵션 대응)
 */
export function formatRadioValue(value: string): string {
  if (!value) return '';

  if (isOtherOptionSelected(value)) {
    const otherInput = extractOtherValue(value);
    return `기타: ${otherInput}`;
  }

  return value;
}
