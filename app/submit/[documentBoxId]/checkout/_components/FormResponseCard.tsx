'use client';

import { FileEdit, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FormFieldGroupData, FormFieldResponseData } from '@/lib/types/form-field';

interface FormResponseCardProps {
  /** 제목 */
  title: string;
  /** 폼 필드 그룹 목록 */
  formFieldGroups: FormFieldGroupData[];
  /** 폼 응답 목록 */
  formResponses: FormFieldResponseData[];
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * FormResponseCard 컴포넌트
 *
 * 제출된 폼 응답을 읽기 전용으로 표시합니다.
 */
export default function FormResponseCard({
  title,
  formFieldGroups,
  formResponses,
  className,
}: FormResponseCardProps) {
  // 응답이 없으면 렌더링하지 않음
  if (formFieldGroups.length === 0) return null;

  // 응답을 Map으로 변환
  const responseMap = new Map(
    formResponses.map((r) => [r.formFieldId, r.value])
  );

  // 그룹 순서대로 정렬
  const sortedGroups = [...formFieldGroups].sort((a, b) => a.order - b.order);

  // 값 포맷팅 (타입별)
  const formatValue = (field: FormFieldGroupData['fields'][0], value: string | undefined): React.ReactNode => {
    if (!value || value.trim() === '') {
      return <span className="text-gray-400 italic">미입력</span>;
    }

    switch (field.fieldType) {
      case 'CHECKBOX':
        return value === 'true' ? (
          <span className="inline-flex items-center gap-1 text-green-600">
            <Check className="w-4 h-4" />
            동의함
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-gray-500">
            <X className="w-4 h-4" />
            동의하지 않음
          </span>
        );

      case 'DATE':
        // YYYY-MM-DD 형식을 한국어 날짜로 변환
        try {
          const date = new Date(value);
          return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } catch {
          return value;
        }

      default:
        return value;
    }
  };

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        {/* 카드 헤더 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileEdit className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>

        {/* 그룹별 응답 목록 */}
        <div className="space-y-6">
          {sortedGroups.map((group) => {
            const sortedFields = [...group.fields].sort((a, b) => a.order - b.order);

            return (
              <div key={group.id} className="border-l-2 border-gray-200 pl-4">
                {/* 그룹 헤더 */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-medium text-gray-800">{group.groupTitle}</span>
                  <Badge variant={group.isRequired ? 'default' : 'secondary'} className="text-xs">
                    {group.isRequired ? '필수' : '선택'}
                  </Badge>
                </div>

                {/* 필드별 응답 */}
                <div className="space-y-2">
                  {sortedFields.map((field) => {
                    const value = responseMap.get(field.id);

                    return (
                      <div key={field.id} className="flex items-start gap-2 text-sm">
                        <span className="text-gray-500 min-w-[100px] shrink-0">
                          {field.fieldLabel}
                          {field.isRequired && <span className="text-red-500">*</span>}
                        </span>
                        <span className="text-gray-900">
                          {formatValue(field, value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
