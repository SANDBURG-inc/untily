'use client';

import { Plus, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  /** '기타' 옵션 토글 */
  onToggleOther: () => void;
}

/**
 * 선택지 편집기 컴포넌트
 *
 * 객관식, 체크박스, 드롭다운 타입에서 선택지를 관리합니다.
 * - 선택지 추가/수정/삭제
 * - '기타' 옵션 토글 (객관식, 체크박스만)
 */
export function OptionsEditor({
  questionType,
  options,
  hasOtherOption,
  onUpdateOption,
  onAddOption,
  onRemoveOption,
  onToggleOther,
}: OptionsEditorProps) {
  // 드롭다운은 '기타' 옵션 불가
  const canHaveOther = questionType === 'SINGLE_CHOICE' || questionType === 'MULTI_CHOICE';

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
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2 group">
          {/* 드래그 핸들 (향후 구현) */}
          <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab" />

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
            onChange={(e) => onUpdateOption(index, e.target.value)}
            placeholder={`옵션 ${index + 1}`}
            className="flex-1 px-2 py-1.5 text-sm text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none transition-colors bg-transparent"
          />

          {/* 삭제 버튼 (최소 2개 유지) */}
          {options.length > 2 && (
            <button
              type="button"
              onClick={() => onRemoveOption(index)}
              className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}

      {/* '기타' 옵션 표시 */}
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
          className="text-sm text-gray-400 hover:text-gray-600"
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
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              &apos;기타&apos; 추가
            </button>
          </>
        )}
      </div>
    </div>
  );
}
