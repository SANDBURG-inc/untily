'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { QuestionTypeSelect } from './QuestionTypeSelect';
import { ShortTextSubTypeSelect } from './ShortTextSubTypeSelect';
import { OptionsEditor } from './OptionsEditor';
import {
  type FormFieldData,
  type QuestionType,
  type ShortTextSubType,
  fieldTypeToQuestionType,
  questionTypeToFieldType,
  QUESTION_TYPE_INFO,
  FORM_FIELD_TYPE_PLACEHOLDERS,
} from '@/lib/types/form-field';

interface QuestionCardProps {
  /** 질문 데이터 */
  question: FormFieldData;
  /** 질문 업데이트 */
  onUpdate: (updates: Partial<FormFieldData>) => void;
  /** 질문 삭제 */
  onRemove: () => void;
  /** 질문 복사 */
  onDuplicate: () => void;
}

/**
 * QuestionCard 컴포넌트
 *
 * 구글 폼 스타일의 개별 질문 카드입니다.
 * - 드래그 핸들이 상단 중앙에 위치
 * - 질문 입력, 타입 선택, 필수 토글
 * - 타입별 옵션 편집 영역
 */
export function QuestionCard({
  question,
  onUpdate,
  onRemove,
  onDuplicate,
}: QuestionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // DB fieldType에서 UI questionType 추출
  const [questionType, subType] = fieldTypeToQuestionType(question.fieldType);
  const typeInfo = QUESTION_TYPE_INFO[questionType];

  // @dnd-kit sortable 훅
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

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

  // 질문 타입 변경 핸들러
  const handleQuestionTypeChange = (newQuestionType: QuestionType) => {
    const newFieldType = questionTypeToFieldType(newQuestionType, 'TEXT');
    const updates: Partial<FormFieldData> = {
      fieldType: newFieldType,
      placeholder: FORM_FIELD_TYPE_PLACEHOLDERS[newFieldType],
    };

    // 선택지가 필요한 타입으로 변경 시 기본 옵션 추가
    const newTypeInfo = QUESTION_TYPE_INFO[newQuestionType];
    if (newTypeInfo.hasOptions && (!question.options || question.options.length === 0)) {
      // 체크박스는 기본 1개, 나머지(객관식, 드롭다운)는 2개
      updates.options = newQuestionType === 'MULTI_CHOICE' ? ['옵션 1'] : ['옵션 1', '옵션 2'];
    }

    // 선택지가 필요 없는 타입으로 변경 시 옵션 초기화
    if (!newTypeInfo.hasOptions) {
      updates.options = [];
      updates.hasOtherOption = false;
    }

    // '기타' 옵션 불가능한 타입으로 변경 시
    if (!newTypeInfo.canHaveOther) {
      updates.hasOtherOption = false;
    }

    onUpdate(updates);
  };

  // 단답형 서브타입 변경 핸들러
  const handleSubTypeChange = (newSubType: ShortTextSubType) => {
    onUpdate({
      fieldType: newSubType,
      placeholder: FORM_FIELD_TYPE_PLACEHOLDERS[newSubType],
    });
  };

  // 선택지 추가
  const handleAddOption = () => {
    const currentOptions = question.options || [];
    onUpdate({ options: [...currentOptions, ''] });
  };

  // 선택지 업데이트
  const handleUpdateOption = (index: number, value: string) => {
    const currentOptions = question.options || [];
    const newOptions = [...currentOptions];
    newOptions[index] = value;
    onUpdate({ options: newOptions });
  };

  // 선택지 삭제
  const handleRemoveOption = (index: number) => {
    const currentOptions = question.options || [];
    const newOptions = [...currentOptions];
    newOptions.splice(index, 1);
    onUpdate({ options: newOptions });
  };

  // '기타' 옵션 토글
  const handleToggleOther = () => {
    onUpdate({ hasOtherOption: !question.hasOtherOption });
  };

  // 선택지 순서 변경
  const handleReorderOptions = (newOptions: string[]) => {
    onUpdate({ options: newOptions });
  };

  return (
    <div ref={setNodeRef} style={style} className="relative py-1">
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative bg-white border rounded-lg shadow-sm transition-all ${
          isDragging ? 'shadow-lg ring-2 ring-blue-300 border-transparent' : ''
        } ${isFocused ? 'ring-2 ring-blue-300 border-transparent' : 'border-gray-200 hover:border-gray-300'}`}
      >
        {/* 드래그 핸들 - 중앙 상단 */}
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

        <div className="p-5">
          {/* 상단: 질문 입력 + 타입 선택 */}
          <div className="flex gap-4 mb-4">
            {/* 질문 입력 */}
            <div className="flex-1">
              <input
                type="text"
                value={question.fieldLabel}
                onChange={(e) => onUpdate({ fieldLabel: e.target.value })}
                placeholder="질문"
                className="w-full px-0 py-2 text-base text-gray-900 border-b border-gray-300 focus:border-blue-500 outline-none transition-colors bg-transparent placeholder:text-gray-400"
              />
            </div>

            {/* 타입 선택 */}
            <div className="flex items-center gap-2">
              <div className="w-[140px]">
                <QuestionTypeSelect
                  value={questionType}
                  onValueChange={handleQuestionTypeChange}
                />
              </div>

              {/* 단답형 서브타입 */}
              {typeInfo.hasSubType && subType && (
                <ShortTextSubTypeSelect
                  value={subType}
                  onValueChange={handleSubTypeChange}
                />
              )}
            </div>
          </div>

          {/* 질문 설명 (선택적) */}
          <input
            type="text"
            value={question.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value || undefined })}
            placeholder="설명 (선택사항)"
            className="w-full px-0 py-1 text-sm text-gray-600 border-b border-transparent hover:border-gray-200 focus:border-blue-500 outline-none transition-colors bg-transparent placeholder:text-gray-400 mb-4"
          />

          {/* 타입별 옵션 영역 */}
          {typeInfo.hasOptions && (
            <div className="mb-4 pl-1">
              <OptionsEditor
                questionType={questionType}
                options={question.options || ['옵션 1', '옵션 2']}
                hasOtherOption={question.hasOtherOption || false}
                onUpdateOption={handleUpdateOption}
                onAddOption={handleAddOption}
                onRemoveOption={handleRemoveOption}
                onReorderOptions={handleReorderOptions}
                onToggleOther={handleToggleOther}
              />
            </div>
          )}

          {/* 하단: 액션 버튼 + 필수 토글 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {/* 액션 버튼 - Focus/Hover 시에만 표시 */}
            <div className={`flex items-center gap-1 transition-opacity duration-200 ${showDragHandle ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <button
                type="button"
                onClick={onDuplicate}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="복사"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* 필수 토글 */}
            <div className="flex items-center gap-2">
              <Label
                htmlFor={`required-${question.id}`}
                className="text-sm text-gray-600 cursor-pointer"
              >
                필수
              </Label>
              <Switch
                id={`required-${question.id}`}
                checked={question.isRequired}
                onCheckedChange={(checked) => onUpdate({ isRequired: checked })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
