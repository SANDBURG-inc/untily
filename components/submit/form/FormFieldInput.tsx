'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { FormFieldData } from '@/lib/types/form-field';
import {
  parseMultiChoiceValue,
  createMultiChoiceValue,
  isOtherOptionSelected,
  extractOtherValue,
  createOtherValue,
} from '@/lib/types/form-field';

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
  const { fieldType, fieldLabel, placeholder, description, isRequired, options, hasOtherOption } = field;

  // '기타' 옵션 입력 상태 (CHECKBOX, RADIO에서 사용)
  const [otherInputValue, setOtherInputValue] = useState(() => {
    if (fieldType === 'CHECKBOX') {
      const { otherValue } = parseMultiChoiceValue(value);
      return otherValue || '';
    }
    if (fieldType === 'RADIO' && isOtherOptionSelected(value)) {
      return extractOtherValue(value);
    }
    return '';
  });

  // 공통 레이블 렌더링
  const renderLabel = () => {
    // 단일 동의 체크박스만 인라인 레이블 사용 (options 없는 경우)
    if (fieldType === 'CHECKBOX' && (!options || options.length === 0)) return null;
    return (
      <div className="mb-3">
        <label className="block text-base text-gray-900">
          {fieldLabel}
          {isRequired && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
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
    case 'TEXT': {
      // 전화번호 패턴이면 기본 placeholder 사용 (타입 변경 후 잘못된 데이터 방어)
      const textPlaceholder = /^0\d{1,2}-\d{3,4}-\d{4}$/.test(placeholder || '')
        ? '내 답변'
        : (placeholder || '내 답변');
      return (
        <div>
          {renderLabel()}
          <div className="relative">
            <Input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={textPlaceholder}
              error={!!error}
              className="pr-16"
            />
            {renderSavingIndicator()}
          </div>
          {renderError()}
        </div>
      );
    }

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

    case 'CHECKBOX': {
      // options가 있으면 복수 선택 체크박스
      if (options && options.length > 0) {
        const { selectedOptions, otherValue } = parseMultiChoiceValue(value);
        const isOtherChecked = otherValue !== null;

        const handleOptionChange = (option: string, checked: boolean) => {
          const newSelected = checked
            ? [...selectedOptions, option]
            : selectedOptions.filter((o) => o !== option);
          onChange(createMultiChoiceValue(newSelected, isOtherChecked ? otherInputValue : null));
        };

        const handleOtherCheck = (checked: boolean) => {
          if (checked) {
            onChange(createMultiChoiceValue(selectedOptions, otherInputValue || ''));
          } else {
            onChange(createMultiChoiceValue(selectedOptions, null));
            setOtherInputValue('');
          }
        };

        const handleOtherInputChange = (inputValue: string) => {
          setOtherInputValue(inputValue);
          // 입력값이 있으면 자동으로 '기타' 체크
          if (inputValue) {
            onChange(createMultiChoiceValue(selectedOptions, inputValue));
          } else if (!isOtherChecked) {
            // 입력값 비우고 체크도 안 된 상태면 기타 제거
            onChange(createMultiChoiceValue(selectedOptions, null));
          } else {
            // 입력값 비웠지만 체크는 유지
            onChange(createMultiChoiceValue(selectedOptions, ''));
          }
        };

        return (
          <div>
            {renderLabel()}
            <div className="space-y-2">
              {options.filter((opt) => opt !== '').map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Checkbox
                    id={`field-${field.id}-${index}`}
                    checked={selectedOptions.includes(option)}
                    onCheckedChange={(checked) => handleOptionChange(option, !!checked)}
                    className={error ? 'border-destructive' : ''}
                  />
                  <Label
                    htmlFor={`field-${field.id}-${index}`}
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
              {hasOtherOption && (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`field-${field.id}-other`}
                    checked={isOtherChecked}
                    onCheckedChange={(checked) => handleOtherCheck(!!checked)}
                    className={error ? 'border-destructive' : ''}
                  />
                  <Label
                    htmlFor={`field-${field.id}-other`}
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    기타:
                  </Label>
                  <Input
                    type="text"
                    value={otherInputValue}
                    onChange={(e) => handleOtherInputChange(e.target.value)}
                    placeholder="직접 입력"
                    className="flex-1 h-8"
                  />
                </div>
              )}
            </div>
            {renderError()}
          </div>
        );
      }

      // options가 없으면 단일 동의 체크박스 (기존 동작)
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
                  'text-sm text-gray-500 cursor-pointer leading-relaxed',
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
    }

    case 'RADIO': {
      const isOtherSelected = isOtherOptionSelected(value);

      const handleRadioChange = (newValue: string) => {
        if (newValue === '__OTHER__') {
          onChange(createOtherValue(otherInputValue));
        } else {
          onChange(newValue);
          setOtherInputValue('');
        }
      };

      const handleOtherInputChange = (inputValue: string) => {
        setOtherInputValue(inputValue);
        // 입력값이 있으면 자동으로 '기타' 선택
        if (inputValue) {
          onChange(createOtherValue(inputValue));
        } else if (!isOtherSelected) {
          // 입력값 비우고 선택도 안 된 상태면 빈 값으로
          onChange('');
        } else {
          // 입력값 비웠지만 기타 선택은 유지
          onChange(createOtherValue(''));
        }
      };

      return (
        <div>
          {renderLabel()}
          <RadioGroup
            value={isOtherSelected ? '__OTHER__' : value}
            onValueChange={handleRadioChange}
            className="flex flex-wrap gap-4"
          >
            {(options || []).filter((opt) => opt !== '').map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <RadioGroupItem
                  value={option}
                  id={`field-${field.id}-${index}`}
                  className={error ? 'border-destructive' : ''}
                />
                <Label
                  htmlFor={`field-${field.id}-${index}`}
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
            {hasOtherOption && (
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="__OTHER__"
                  id={`field-${field.id}-other`}
                  className={error ? 'border-destructive' : ''}
                />
                <Label
                  htmlFor={`field-${field.id}-other`}
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  기타:
                </Label>
                <Input
                  type="text"
                  value={otherInputValue}
                  onChange={(e) => handleOtherInputChange(e.target.value)}
                  placeholder="직접 입력"
                  className="flex-1 h-8 max-w-[200px]"
                />
              </div>
            )}
          </RadioGroup>
          {renderError()}
        </div>
      );
    }

    case 'DROPDOWN':
      return (
        <div>
          {renderLabel()}
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={placeholder || '선택하세요'} />
            </SelectTrigger>
            <SelectContent>
              {(options || [])
                .filter((option) => option !== '')
                .map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {renderError()}
        </div>
      );

    case 'TIME':
      return (
        <div>
          {renderLabel()}
          <TimePicker
            value={value}
            onTimeChange={onChange}
            placeholder={placeholder || '시간을 선택하세요'}
            className={error ? 'border-destructive' : ''}
          />
          {renderError()}
        </div>
      );

    default:
      return null;
  }
}
