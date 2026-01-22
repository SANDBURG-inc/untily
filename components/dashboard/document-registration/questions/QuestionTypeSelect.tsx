'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type QuestionType,
  QUESTION_TYPE_INFO,
} from '@/lib/types/form-field';

const QUESTION_TYPES: QuestionType[] = [
  'SHORT_TEXT',
  'LONG_TEXT',
  'SINGLE_CHOICE',
  'MULTI_CHOICE',
  'DROPDOWN',
  'DATE',
  'TIME',
];

interface QuestionTypeSelectProps {
  value: QuestionType;
  onValueChange: (value: QuestionType) => void;
}

/**
 * 질문 타입 선택 드롭다운
 *
 * 구글 폼 스타일로 아이콘과 함께 질문 타입을 선택합니다.
 */
export function QuestionTypeSelect({
  value,
  onValueChange,
}: QuestionTypeSelectProps) {
  const selectedInfo = QUESTION_TYPE_INFO[value];
  const SelectedIcon = selectedInfo.icon;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue>
          <div className="flex items-center gap-2">
            <SelectedIcon className="w-4 h-4 text-gray-500" />
            <span>{selectedInfo.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {QUESTION_TYPES.map((type) => {
          const info = QUESTION_TYPE_INFO[type];
          const Icon = info.icon;
          return (
            <SelectItem key={type} value={type}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-gray-500" />
                <span>{info.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
