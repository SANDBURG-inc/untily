'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type ShortTextSubType,
  SHORT_TEXT_SUBTYPE_INFO,
} from '@/lib/types/form-field';

const SUB_TYPES: ShortTextSubType[] = ['TEXT', 'EMAIL', 'TEL'];

interface ShortTextSubTypeSelectProps {
  value: ShortTextSubType;
  onValueChange: (value: ShortTextSubType) => void;
}

/**
 * 단답형 서브타입 선택 드롭다운
 *
 * 단답형(SHORT_TEXT) 선택 시 세부 유형을 선택합니다.
 * - 텍스트: 일반 텍스트 입력
 * - 이메일: 이메일 형식 검증
 * - 전화번호: 전화번호 형식 검증
 */
export function ShortTextSubTypeSelect({
  value,
  onValueChange,
}: ShortTextSubTypeSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[100px]">
        <SelectValue>
          {SHORT_TEXT_SUBTYPE_INFO[value].label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUB_TYPES.map((subType) => (
          <SelectItem key={subType} value={subType}>
            {SHORT_TEXT_SUBTYPE_INFO[subType].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
