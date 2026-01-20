'use client';

import { Plus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldTypeSelect } from './FieldTypeSelect';
import {
  type FormFieldData,
  type FormFieldType,
  requiresOptions,
} from '@/lib/types/form-field';

export interface FieldEditorProps {
  /** 필드 데이터 */
  field: FormFieldData;
  /** 필드 인덱스 (표시용) */
  fieldIndex: number;
  /** 삭제 가능 여부 */
  canDelete: boolean;
  /** 단일 필드 속성 업데이트 */
  onUpdate: (field: keyof FormFieldData, value: string | boolean | number | string[]) => void;
  /** 필드 타입 변경 (연관 속성 일괄 업데이트) */
  onChangeType: (newType: FormFieldType) => void;
  /** 필드 삭제 */
  onRemove: () => void;
  /** 선택지 추가 */
  onAddOption: () => void;
  /** 선택지 업데이트 */
  onUpdateOption: (optionIndex: number, value: string) => void;
  /** 선택지 삭제 */
  onRemoveOption: (optionIndex: number) => void;
}

/**
 * 폼 필드 편집기 컴포넌트
 *
 * 개별 필드의 레이블, 타입, 필수 여부 등을 설정합니다.
 * RADIO 타입의 경우 선택지 관리 기능을 제공합니다.
 */
export function FieldEditor({
  field,
  fieldIndex,
  canDelete,
  onUpdate,
  onChangeType,
  onRemove,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: FieldEditorProps) {
  return (
    <div className="relative p-3 bg-gray-50 rounded-lg">
      {/* 필드 삭제 버튼 */}
      {canDelete && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="flex items-center gap-2 mb-3 pr-6">
        <span className="text-xs text-gray-400">필드 {fieldIndex + 1}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 레이블 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            레이블<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={field.fieldLabel}
            onChange={(e) => onUpdate('fieldLabel', e.target.value)}
            placeholder="예: 생년월일"
            className="w-full px-2.5 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
          />
        </div>

        {/* 타입 - ShadcnUI Select 사용 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            타입<span className="text-red-500">*</span>
          </label>
          <FieldTypeSelect
            value={field.fieldType}
            onValueChange={onChangeType}
          />
        </div>

        {/* 필수 여부 */}
        <div className="flex items-end pb-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`required-${field.id}`}
              checked={field.isRequired}
              onCheckedChange={(checked) => onUpdate('isRequired', checked as boolean)}
            />
            <label
              htmlFor={`required-${field.id}`}
              className="text-sm text-gray-700 cursor-pointer select-none"
            >
              필수
            </label>
          </div>
        </div>
      </div>

      {/* 플레이스홀더 (체크박스일 때만 표시) */}
      {field.fieldType === 'CHECKBOX' && (
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            체크박스 텍스트
          </label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => onUpdate('placeholder', e.target.value)}
            placeholder="예: 위 내용에 동의합니다"
            className="w-full px-2.5 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
      )}

      {/* 선택지 (RADIO 타입일 때만 표시) */}
      {requiresOptions(field.fieldType) && (
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            선택지
          </label>
          <div className="space-y-2">
            {(field.options || []).map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4">{optionIndex + 1}.</span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => onUpdateOption(optionIndex, e.target.value)}
                  placeholder={`선택지 ${optionIndex + 1}`}
                  className="flex-1 px-2.5 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
                {(field.options?.length || 0) > 2 && (
                  <button
                    type="button"
                    onClick={() => onRemoveOption(optionIndex)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={onAddOption}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              선택지 추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
