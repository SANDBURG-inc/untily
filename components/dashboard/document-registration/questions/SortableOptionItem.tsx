'use client';

import { GripVertical, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { QuestionType } from '@/lib/types/form-field';

interface SortableOptionItemProps {
  /** 드래그 식별자 */
  id: string;
  /** 옵션 인덱스 */
  index: number;
  /** 옵션 값 */
  option: string;
  /** 질문 타입 */
  questionType: QuestionType;
  /** 삭제 가능 여부 (최소 개수 유지) */
  canDelete: boolean;
  /** 옵션 값 업데이트 */
  onUpdate: (value: string) => void;
  /** 옵션 삭제 */
  onRemove: () => void;
}

/**
 * 드래그 가능한 옵션 아이템 컴포넌트
 *
 * @dnd-kit의 useSortable 훅을 사용하여 드래그 앤 드롭 기능을 구현합니다.
 * 기존 OptionsEditor의 옵션 row UI를 재사용합니다.
 */
export function SortableOptionItem({
  id,
  index,
  option,
  questionType,
  canDelete,
  onUpdate,
  onRemove,
}: SortableOptionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
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
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 group',
        isDragging && 'bg-white rounded shadow-sm'
      )}
    >
      {/* 드래그 핸들 */}
      <button
        type="button"
        className="p-0.5 cursor-grab active:cursor-grabbing text-gray-300 opacity-0 group-hover:opacity-100 hover:text-gray-400 transition-opacity touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* 선택지 아이콘 또는 번호 */}
      {questionType === 'DROPDOWN' ? (
        <span className="text-sm text-gray-400 w-5">{index + 1}.</span>
      ) : (
        <OptionIcon />
      )}

      {/* 선택지 입력 */}
      <input
        type="text"
        value={option}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder={`옵션 ${index + 1}`}
        className="flex-1 px-2 py-1.5 text-sm text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none transition-colors bg-transparent"
      />

      {/* 삭제 버튼 */}
      {canDelete && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
