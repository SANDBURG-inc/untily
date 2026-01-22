'use client';

import { useMemo } from 'react';
import { X, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { SortableOptionItem } from './SortableOptionItem';
import type { QuestionType } from '@/lib/types/form-field';

interface OptionsEditorProps {
  /** 질문 타입 */
  questionType: QuestionType;
  /** 선택지 목록 */
  options: string[];
  /** '기타' 옵션 활성화 여부 */
  hasOtherOption: boolean;
  /** 선택지 업데이트 */
  onUpdateOption: (index: number, value: string) => void;
  /** 선택지 추가 */
  onAddOption: () => void;
  /** 선택지 삭제 */
  onRemoveOption: (index: number) => void;
  /** 선택지 순서 변경 */
  onReorderOptions: (newOptions: string[]) => void;
  /** '기타' 옵션 토글 */
  onToggleOther: () => void;
}

/**
 * 선택지 편집기 컴포넌트
 *
 * 객관식, 체크박스, 드롭다운 타입에서 선택지를 관리합니다.
 * - 선택지 추가/수정/삭제
 * - 드래그 앤 드롭으로 순서 변경
 * - '기타' 옵션 토글 (객관식, 체크박스만)
 */
export function OptionsEditor({
  questionType,
  options,
  hasOtherOption,
  onUpdateOption,
  onAddOption,
  onRemoveOption,
  onReorderOptions,
  onToggleOther,
}: OptionsEditorProps) {
  // 드롭다운은 '기타' 옵션 불가
  const canHaveOther = questionType === 'SINGLE_CHOICE' || questionType === 'MULTI_CHOICE';

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동 후 드래그 시작 (스크롤과 구분)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 옵션별 고유 ID 생성 (인덱스 기반)
  const optionIds = useMemo(
    () => options.map((_, index) => `option-${index}`),
    [options]
  );

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = optionIds.indexOf(active.id as string);
      const newIndex = optionIds.indexOf(over.id as string);
      const newOptions = arrayMove(options, oldIndex, newIndex);
      onReorderOptions(newOptions);
    }
  };

  // 선택지 아이콘 (타입별로 다름)
  const OptionIcon = ({ className }: { className?: string }) => {
    if (questionType === 'SINGLE_CHOICE') {
      return (
        <div className={cn('w-4 h-4 rounded-full border-2 border-gray-300', className)} />
      );
    }
    if (questionType === 'MULTI_CHOICE') {
      return (
        <div className={cn('w-4 h-4 rounded border-2 border-gray-300', className)} />
      );
    }
    // DROPDOWN: 숫자로 표시
    return null;
  };

  return (
    <div className="space-y-2">
      {/* 드래그 가능한 옵션 목록 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={optionIds}
          strategy={verticalListSortingStrategy}
        >
          {options.map((option, index) => (
            <SortableOptionItem
              key={optionIds[index]}
              id={optionIds[index]}
              index={index}
              option={option}
              questionType={questionType}
              canDelete={options.length > 2}
              onUpdate={(value) => onUpdateOption(index, value)}
              onRemove={() => onRemoveOption(index)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* '기타' 옵션 표시 (드래그 불가, 항상 마지막 고정) */}
      {canHaveOther && hasOtherOption && (
        <div className="flex items-center gap-2 group">
          <GripVertical className="w-4 h-4 text-gray-300 opacity-0" />
          <OptionIcon className="border-dashed" />
          <span className="flex-1 px-2 py-1.5 text-sm text-gray-400 italic">
            기타...
          </span>
          <button
            type="button"
            onClick={onToggleOther}
            className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 선택지 추가 버튼 */}
      <div className="flex items-center gap-2 pt-1">
        <div className="w-4" /> {/* 드래그 핸들 공간 */}
        {questionType === 'DROPDOWN' ? (
          <span className="text-sm text-gray-400 w-5">{options.length + 1}.</span>
        ) : (
          <OptionIcon className="opacity-50" />
        )}
        <button
          type="button"
          onClick={onAddOption}
          className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
        >
          옵션 추가
        </button>

        {/* '기타' 추가 버튼 */}
        {canHaveOther && !hasOtherOption && (
          <>
            <span className="text-gray-300">또는</span>
            <button
              type="button"
              onClick={onToggleOther}
              className="text-sm text-blue-400 hover:text-blue-500 hover:underline font-medium"
            >
              &apos;기타&apos; 추가
            </button>
          </>
        )}
      </div>
    </div>
  );
}
