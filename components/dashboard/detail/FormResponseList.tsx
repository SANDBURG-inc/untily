'use client';

import { ClipboardList } from 'lucide-react';
import { SectionHeader } from '@/components/shared/SectionHeader';
import type {
  FormFieldType,
  FormResponseGroupViewData,
} from '@/lib/types/form-field';

interface FormResponseListProps {
  groups: FormResponseGroupViewData[];
}

/**
 * 폼 필드 값을 표시용으로 포맷팅
 */
function formatFieldValue(
  fieldType: FormFieldType,
  value: string | null
): string {
  if (value === null || value === '') {
    return '-';
  }

  switch (fieldType) {
    case 'CHECKBOX':
      return value === 'true' ? '동의함' : '동의하지 않음';
    case 'DATE':
      // YYYY-MM-DD → YYYY.MM.DD 포맷
      return value.replace(/-/g, '.');
    default:
      return value;
  }
}

/**
 * 폼 응답 목록 컴포넌트
 * 제출자가 입력한 폼 필드 응답을 그룹별로 표시
 */
export function FormResponseList({ groups }: FormResponseListProps) {
  // 폼 필드가 없으면 렌더링하지 않음
  if (groups.length === 0) {
    return null;
  }

  return (
    <div>
      <SectionHeader
        icon={ClipboardList}
        title="입력 정보"
        size="sm"
        className="mb-4"
      />

      <div className="space-y-4">
        {groups.map((group) => (
          <div
            key={group.formFieldGroupId}
            className="p-4 bg-gray-50 rounded-lg space-y-3"
          >
            {/* 그룹 헤더 */}
            <div className="border-b border-gray-200 pb-2">
              <h4 className="text-sm font-semibold text-gray-900">
                {group.groupTitle}
              </h4>
              {group.groupDescription && (
                <p className="text-xs text-gray-500 mt-1">
                  {group.groupDescription}
                </p>
              )}
            </div>

            {/* 필드 목록 */}
            <div className="space-y-2">
              {group.fields.map((field) => (
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
                    {formatFieldValue(field.fieldType, field.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
