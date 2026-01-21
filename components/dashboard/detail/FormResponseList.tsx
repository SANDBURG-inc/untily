'use client';

import { ClipboardList } from 'lucide-react';
import type {
  FormFieldType,
  FormResponseViewData,
  FormResponseGroupViewData,
} from '@/lib/types/form-field';
import {
  isOtherOptionSelected,
  extractOtherValue,
  parseMultiChoiceValue,
} from '@/lib/types/form-field';

interface FormResponseListProps {
  /** 새 구조: 필드 배열 직접 전달 */
  fields?: FormResponseViewData[];
  /** @deprecated 기존 구조: 그룹 배열 (하위 호환성) */
  groups?: FormResponseGroupViewData[];
}

/**
 * 폼 필드 값을 표시용으로 포맷팅
 */
function formatFieldValue(
  fieldType: FormFieldType,
  value: string | null,
  options?: string[]
): string {
  if (value === null || value === '') {
    return '-';
  }

  switch (fieldType) {
    case 'CHECKBOX':
      // 단순 동의 체크박스
      if (value === 'true') return '동의함';
      if (value === 'false') return '동의하지 않음';
      // 복수 선택 체크박스
      const { selectedOptions, otherValue } = parseMultiChoiceValue(value);
      const parts = [...selectedOptions];
      if (otherValue) parts.push(`기타: ${otherValue}`);
      return parts.length > 0 ? parts.join(', ') : '-';

    case 'RADIO':
    case 'DROPDOWN':
      // '기타' 옵션 처리
      if (isOtherOptionSelected(value)) {
        return `기타: ${extractOtherValue(value)}`;
      }
      return value;

    case 'DATE':
      // YYYY-MM-DD → YYYY.MM.DD 포맷
      return value.replace(/-/g, '.');

    case 'TIME':
      return value;

    default:
      return value;
  }
}

/**
 * 폼 응답 목록 컴포넌트
 * 제출자가 입력한 폼 필드 응답을 표시
 */
export function FormResponseList({ fields, groups }: FormResponseListProps) {
  // 새 구조 우선, 없으면 기존 그룹에서 평탄화
  const allFields: FormResponseViewData[] = fields ||
    (groups ? groups.flatMap(g => g.fields) : []);

  // 폼 필드가 없으면 렌더링하지 않음
  if (allFields.length === 0) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* 섹션 헤더 - 컨테이너 안에 통합 */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">입력 정보</span>
        </div>
      </div>

      {/* 컨텐츠 - 흰 배경 */}
      <div className="p-4 space-y-2">
        {allFields.map((field) => (
          <div
            key={field.formFieldId}
            className="flex items-start gap-2 text-sm"
          >
            <span className="text-gray-500 flex-shrink-0 min-w-[100px]">
              {field.fieldLabel}:
            </span>
            <span className="text-gray-900">
              {field.fieldType === 'CHECKBOX' &&
                field.value === 'true' && (
                  <span className="text-green-600 mr-1">✓</span>
                )}
              {formatFieldValue(field.fieldType, field.value, field.options)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
