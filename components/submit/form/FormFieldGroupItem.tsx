'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FormFieldInput } from './FormFieldInput';
import type { FormFieldGroupData } from '@/lib/types/form-field';

interface FormFieldGroupItemProps {
  /** 폼 필드 그룹 데이터 */
  group: FormFieldGroupData;
  /** 현재 응답 값 (필드ID -> 값) */
  responses: Map<string, string>;
  /** 응답 변경 핸들러 */
  onResponseChange: (fieldId: string, value: string) => void;
  /** 필드별 에러 메시지 (필드ID -> 에러) */
  errors: Map<string, string>;
  /** 저장 중인 필드 ID Set */
  savingFields?: Set<string>;
}

/**
 * FormFieldGroupItem 컴포넌트
 *
 * 폼 필드 그룹을 카드 형태로 렌더링합니다.
 * 그룹 제목, 설명, 필수 여부를 표시하고 내부 필드들을 렌더링합니다.
 */
export function FormFieldGroupItem({
  group,
  responses,
  onResponseChange,
  errors,
  savingFields = new Set(),
}: FormFieldGroupItemProps) {
  const { groupTitle, groupDescription, fields } = group;

  // 필드 순서대로 정렬
  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  return (
    <Card>
      <CardContent>
        {/* 헤더 - TODO: group 개념 제거됨, 추후 컴포넌트 구조 정리 필요 */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900">입력 항목</h3>
          {groupDescription && (
            <p className="text-sm text-gray-500 mt-1">{groupDescription}</p>
          )}
        </div>

        {/* 필드 목록 */}
        <div className="space-y-4">
          {sortedFields.map((field) => (
            <FormFieldInput
              key={field.id}
              field={field}
              value={responses.get(field.id) || ''}
              onChange={(value) => onResponseChange(field.id, value)}
              error={errors.get(field.id)}
              isSaving={savingFields.has(field.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
