'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type FormFieldType,
  FORM_FIELD_TYPE_LABELS,
} from '@/lib/types/form-field';

interface FieldTypeSelectProps {
  /** 현재 선택된 필드 타입 */
  value: FormFieldType;
  /** 타입 변경 핸들러 */
  onValueChange: (type: FormFieldType) => void;
}

const FIELD_TYPES = Object.entries(FORM_FIELD_TYPE_LABELS) as [FormFieldType, string][];

/**
 * 폼 필드 타입 선택 드롭다운
 *
 * ShadcnUI Select를 사용하여 접근성과 일관된 UX를 제공합니다.
 */
export function FieldTypeSelect({ value, onValueChange }: FieldTypeSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as FormFieldType)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="타입 선택" />
      </SelectTrigger>
      <SelectContent>
        {FIELD_TYPES.map(([type, label]) => (
          <SelectItem key={type} value={type}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
