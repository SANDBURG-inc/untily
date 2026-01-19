'use client';

import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import type { FormFieldData } from '@/lib/types/form-field';

interface FormFieldInputProps {
  /** 필드 정의 */
  field: FormFieldData;
  /** 현재 값 */
  value: string;
  /** 값 변경 핸들러 */
  onChange: (value: string) => void;
  /** 에러 메시지 */
  error?: string;
  /** 저장 중 여부 */
  isSaving?: boolean;
}

/**
 * FormFieldInput 컴포넌트
 *
 * 폼 필드 타입에 따라 적절한 입력 컴포넌트를 렌더링합니다.
 */
export function FormFieldInput({
  field,
  value,
  onChange,
  error,
  isSaving,
}: FormFieldInputProps) {
  const { fieldType, fieldLabel, placeholder, isRequired, options } = field;

  // 공통 레이블 렌더링
  const renderLabel = () => {
    if (fieldType === 'CHECKBOX') return null; // 체크박스는 인라인 레이블
    return (
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {fieldLabel}
        {isRequired && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    );
  };

  // 에러 메시지 렌더링
  const renderError = () => {
    if (!error) return null;
    return <p className="mt-1 text-sm text-red-500">{error}</p>;
  };

  // 저장 인디케이터 렌더링
  const renderSavingIndicator = () => {
    if (!isSaving) return null;
    return (
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
        저장 중...
      </span>
    );
  };

  switch (fieldType) {
    case 'TEXT':
      return (
        <div>
          {renderLabel()}
          <div className="relative">
            <Input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || '텍스트를 입력하세요'}
              error={!!error}
              className="pr-16"
            />
            {renderSavingIndicator()}
          </div>
          {renderError()}
        </div>
      );

    case 'TEXTAREA':
      return (
        <div>
          {renderLabel()}
          <div className="relative">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || '내용을 입력하세요'}
              rows={3}
              className={cn(
                'w-full px-3 py-2 text-sm text-gray-900 border rounded-md resize-none',
                'focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none',
                'placeholder:text-muted-foreground',
                error ? 'border-destructive' : 'border-input'
              )}
            />
          </div>
          {renderError()}
        </div>
      );

    case 'EMAIL':
      return (
        <div>
          {renderLabel()}
          <div className="relative">
            <Input
              type="email"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || 'example@email.com'}
              error={!!error}
              className="pr-16"
            />
            {renderSavingIndicator()}
          </div>
          {renderError()}
        </div>
      );

    case 'TEL':
      return (
        <div>
          {renderLabel()}
          <div className="relative">
            <Input
              type="tel"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || '010-1234-5678'}
              error={!!error}
              className="pr-16"
            />
            {renderSavingIndicator()}
          </div>
          {renderError()}
        </div>
      );

    case 'DATE':
      return (
        <div>
          {renderLabel()}
          <DatePicker
            date={value ? new Date(value) : undefined}
            onDateChange={(date) => {
              if (date) {
                // ISO 날짜 문자열로 변환 (YYYY-MM-DD)
                const isoDate = date.toISOString().split('T')[0];
                onChange(isoDate);
              } else {
                onChange('');
              }
            }}
            placeholder={placeholder || '날짜를 선택하세요'}
            className={error ? 'border-destructive' : ''}
          />
          {renderError()}
        </div>
      );

    case 'CHECKBOX':
      return (
        <div>
          <div className="flex items-start gap-3">
            <Checkbox
              id={`field-${field.id}`}
              checked={value === 'true'}
              onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
              className={cn(
                'mt-0.5',
                error && 'border-destructive'
              )}
            />
            <div className="flex-1">
              <Label
                htmlFor={`field-${field.id}`}
                className={cn(
                  'text-sm text-gray-700 cursor-pointer leading-relaxed',
                  error && 'text-destructive'
                )}
              >
                {placeholder || fieldLabel}
                {isRequired && <span className="text-red-500 ml-0.5">*</span>}
              </Label>
            </div>
          </div>
          {renderError()}
        </div>
      );

    case 'RADIO':
      return (
        <div>
          {renderLabel()}
          <RadioGroup
            value={value}
            onValueChange={onChange}
            className="flex flex-wrap gap-4"
          >
            {(options || []).map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <RadioGroupItem
                  value={option}
                  id={`field-${field.id}-${index}`}
                  className={error ? 'border-destructive' : ''}
                />
                <Label
                  htmlFor={`field-${field.id}-${index}`}
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {renderError()}
        </div>
      );

    default:
      return null;
  }
}
