'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FieldEditor, GroupRequiredSelect } from './index';
import type { FormFieldGroupData, FormFieldData, FormFieldType } from '@/lib/types/form-field';

interface FormFieldGroupItemProps {
  /** 그룹 데이터 */
  group: FormFieldGroupData;
  /** 그룹 인덱스 (표시용) */
  groupIndex: number;
  /** 그룹 업데이트 핸들러 */
  onUpdateGroup: (field: keyof FormFieldGroupData, value: string | boolean) => void;
  /** 그룹 삭제 핸들러 */
  onRemoveGroup: () => void;
  /** 필드 추가 핸들러 */
  onAddField: () => void;
  /** 필드 업데이트 핸들러 */
  onUpdateField: (
    fieldId: string,
    fieldKey: keyof FormFieldData,
    value: string | boolean | number | string[]
  ) => void;
  /** 필드 타입 변경 핸들러 */
  onChangeFieldType: (
    fieldId: string,
    newType: FormFieldType,
    options?: string[]
  ) => void;
  /** 필드 삭제 핸들러 */
  onRemoveField: (fieldId: string) => void;
  /** 옵션 추가 핸들러 */
  onAddOption: (fieldId: string) => void;
  /** 옵션 업데이트 핸들러 */
  onUpdateOption: (fieldId: string, optionIndex: number, value: string) => void;
  /** 옵션 삭제 핸들러 */
  onRemoveOption: (fieldId: string, optionIndex: number) => void;
}

/**
 * FormFieldGroupItem 컴포넌트
 *
 * 개별 폼 필드 그룹을 표시하는 컴포넌트입니다.
 * 드래그 앤 드롭으로 순서 변경이 가능합니다.
 */
export function FormFieldGroupItem({
  group,
  groupIndex,
  onUpdateGroup,
  onRemoveGroup,
  onAddField,
  onUpdateField,
  onChangeFieldType,
  onRemoveField,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: FormFieldGroupItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // @dnd-kit sortable 훅
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 컨테이너 내부 포커스 감지
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocusIn = () => setIsFocused(true);
    const handleFocusOut = (e: FocusEvent) => {
      if (!container.contains(e.relatedTarget as Node)) {
        setIsFocused(false);
      }
    };

    container.addEventListener('focusin', handleFocusIn);
    container.addEventListener('focusout', handleFocusOut);

    return () => {
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const showDragHandle = isHovered || isFocused || isDragging;

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative border border-gray-200 rounded-lg p-4 transition-all ${
          isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''
        }`}
      >
        {/* 드래그 핸들 - 중앙 상단에 위치, hover/focus 시에만 표시 */}
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-200 ${
            showDragHandle ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            type="button"
            className="p-1 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5 text-gray-300 hover:text-gray-400 rotate-90" />
          </button>
        </div>

        {/* 그룹 삭제 버튼 */}
        <button
          type="button"
          onClick={onRemoveGroup}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 그룹 헤더 */}
        <div className="flex items-center gap-2 mb-4 pr-8">
          <span className="text-xs text-gray-400">그룹 {groupIndex + 1}</span>
        </div>

        {/* 그룹 정보 입력 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-2">
              그룹명<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={group.groupTitle}
              onChange={(e) => onUpdateGroup('groupTitle', e.target.value)}
              placeholder="예: 개인정보 수집 동의"
              className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-2">
              유형<span className="text-red-500">*</span>
            </label>
            <GroupRequiredSelect
              value={group.isRequired}
              onValueChange={(isRequired) =>
                onUpdateGroup('isRequired', isRequired)
              }
            />
          </div>
        </div>

        {/* 그룹 설명 */}
        <div className="mb-4">
          <label className="block text-sm font-normal text-gray-700 mb-2">
            설명
          </label>
          <textarea
            value={group.groupDescription || ''}
            onChange={(e) => onUpdateGroup('groupDescription', e.target.value)}
            placeholder="예: 개인정보 보호법에 따른 동의서입니다."
            rows={2}
            className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 resize-none"
          />
        </div>

        {/* 필드 목록 */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-normal text-gray-700 mb-3">입력 필드</p>
          <div className="space-y-4">
            {group.fields.map((field, fieldIndex) => (
              <FieldEditor
                key={field.id}
                field={field}
                fieldIndex={fieldIndex}
                canDelete={group.fields.length > 1}
                onUpdate={(fieldKey, value) =>
                  onUpdateField(field.id, fieldKey, value)
                }
                onChangeType={(newType) =>
                  onChangeFieldType(field.id, newType, field.options)
                }
                onRemove={() => onRemoveField(field.id)}
                onAddOption={() => onAddOption(field.id)}
                onUpdateOption={(optionIndex, value) =>
                  onUpdateOption(field.id, optionIndex, value)
                }
                onRemoveOption={(optionIndex) =>
                  onRemoveOption(field.id, optionIndex)
                }
              />
            ))}
          </div>

          {/* 필드 추가 버튼 */}
          <button
            type="button"
            onClick={onAddField}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            필드 추가
          </button>
        </div>
      </div>
    </div>
  );
}
