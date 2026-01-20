'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GroupRequiredSelectProps {
  /** 필수 여부 (true: 필수, false: 옵션) */
  value: boolean;
  /** 필수 여부 변경 핸들러 */
  onValueChange: (isRequired: boolean) => void;
}

/**
 * 그룹/필드 필수 여부 선택 드롭다운
 *
 * ShadcnUI Select를 사용하여 접근성과 일관된 UX를 제공합니다.
 */
export function GroupRequiredSelect({ value, onValueChange }: GroupRequiredSelectProps) {
  return (
    <Select
      value={value ? 'required' : 'optional'}
      onValueChange={(v) => onValueChange(v === 'required')}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="유형 선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="required">필수</SelectItem>
        <SelectItem value="optional">옵션</SelectItem>
      </SelectContent>
    </Select>
  );
}
