'use client';

import { Plus, X, FileEdit, ChevronDown, GripVertical } from 'lucide-react';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { IconButton } from '@/components/shared/IconButton';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  type FormFieldGroupData,
  type FormFieldData,
  type FormFieldType,
  FORM_FIELD_TYPE_LABELS,
  FORM_FIELD_TYPE_PLACEHOLDERS,
  requiresOptions,
} from '@/lib/types/form-field';

interface FormFieldGroupsCardProps {
  /** 폼 필드 그룹 목록 */
  formFieldGroups: FormFieldGroupData[];
  /** 폼 필드 그룹 변경 핸들러 */
  onFormFieldGroupsChange: (groups: FormFieldGroupData[]) => void;
  /** 표시 위치 설정 (true: 수집 서류 위, false: 아래) */
  formFieldsAboveDocuments: boolean;
  /** 표시 위치 변경 핸들러 */
  onFormFieldsAboveDocumentsChange: (above: boolean) => void;
}

/**
 * FormFieldGroupsCard 컴포넌트
 *
 * 정보 입력 항목(폼 필드)을 등록하는 카드 컴포넌트입니다.
 * 그룹별로 필드를 관리하며, 다양한 입력 타입을 지원합니다.
 */
export function FormFieldGroupsCard({
  formFieldGroups,
  onFormFieldGroupsChange,
  formFieldsAboveDocuments,
  onFormFieldsAboveDocumentsChange,
}: FormFieldGroupsCardProps) {
  /**
   * 새 그룹 추가
   */
  const addGroup = () => {
    const newGroup: FormFieldGroupData = {
      id: `group-${Date.now()}`,
      groupTitle: '',
      groupDescription: '',
      isRequired: true,
      order: formFieldGroups.length,
      fields: [createEmptyField(0)],
    };
    onFormFieldGroupsChange([...formFieldGroups, newGroup]);
  };

  /**
   * 그룹 삭제
   */
  const removeGroup = (groupId: string) => {
    onFormFieldGroupsChange(formFieldGroups.filter((g) => g.id !== groupId));
  };

  /**
   * 그룹 업데이트
   */
  const updateGroup = (
    groupId: string,
    field: keyof FormFieldGroupData,
    value: string | boolean | number
  ) => {
    onFormFieldGroupsChange(
      formFieldGroups.map((g) =>
        g.id === groupId ? { ...g, [field]: value } : g
      )
    );
  };

  /**
   * 빈 필드 생성
   */
  const createEmptyField = (order: number): FormFieldData => ({
    id: `field-${Date.now()}-${order}`,
    fieldLabel: '',
    fieldType: 'TEXT',
    placeholder: '',
    isRequired: true,
    order,
    options: [],
  });

  /**
   * 필드 추가
   */
  const addField = (groupId: string) => {
    onFormFieldGroupsChange(
      formFieldGroups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            fields: [...g.fields, createEmptyField(g.fields.length)],
          };
        }
        return g;
      })
    );
  };

  /**
   * 필드 삭제
   */
  const removeField = (groupId: string, fieldId: string) => {
    onFormFieldGroupsChange(
      formFieldGroups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            fields: g.fields.filter((f) => f.id !== fieldId),
          };
        }
        return g;
      })
    );
  };

  /**
   * 필드 업데이트
   */
  const updateField = (
    groupId: string,
    fieldId: string,
    field: keyof FormFieldData,
    value: string | boolean | number | string[]
  ) => {
    onFormFieldGroupsChange(
      formFieldGroups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            fields: g.fields.map((f) =>
              f.id === fieldId ? { ...f, [field]: value } : f
            ),
          };
        }
        return g;
      })
    );
  };

  /**
   * 선택지 추가 (radio 타입)
   */
  const addOption = (groupId: string, fieldId: string) => {
    onFormFieldGroupsChange(
      formFieldGroups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            fields: g.fields.map((f) => {
              if (f.id === fieldId) {
                return {
                  ...f,
                  options: [...(f.options || []), ''],
                };
              }
              return f;
            }),
          };
        }
        return g;
      })
    );
  };

  /**
   * 선택지 업데이트
   */
  const updateOption = (
    groupId: string,
    fieldId: string,
    optionIndex: number,
    value: string
  ) => {
    onFormFieldGroupsChange(
      formFieldGroups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            fields: g.fields.map((f) => {
              if (f.id === fieldId && f.options) {
                const newOptions = [...f.options];
                newOptions[optionIndex] = value;
                return { ...f, options: newOptions };
              }
              return f;
            }),
          };
        }
        return g;
      })
    );
  };

  /**
   * 선택지 삭제
   */
  const removeOption = (
    groupId: string,
    fieldId: string,
    optionIndex: number
  ) => {
    onFormFieldGroupsChange(
      formFieldGroups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            fields: g.fields.map((f) => {
              if (f.id === fieldId && f.options) {
                const newOptions = [...f.options];
                newOptions.splice(optionIndex, 1);
                return { ...f, options: newOptions };
              }
              return f;
            }),
          };
        }
        return g;
      })
    );
  };

  // 그룹이 없으면 섹션 자체를 숨김
  if (formFieldGroups.length === 0) {
    return (
      <>
        <SectionHeader icon={FileEdit} title="정보 입력 항목" size="md" />
        <div className="mt-4">
          <IconButton
            type="button"
            variant="secondary"
            icon={<Plus className="w-4 h-4" />}
            onClick={addGroup}
            className="w-full"
          >
            정보 입력 항목 추가
          </IconButton>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader icon={FileEdit} title="정보 입력 항목" size="md" />

      {/* 표시 위치 설정 */}
      <div className="mt-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-3">
          제출자 화면에서 표시 위치
        </p>
        <RadioGroup
          value={formFieldsAboveDocuments ? 'above' : 'below'}
          onValueChange={(value) =>
            onFormFieldsAboveDocumentsChange(value === 'above')
          }
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="above" id="position-above" />
            <Label htmlFor="position-above" className="text-sm text-gray-600 cursor-pointer">
              수집 서류 위
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="below" id="position-below" />
            <Label htmlFor="position-below" className="text-sm text-gray-600 cursor-pointer">
              수집 서류 아래
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* 그룹 목록 */}
      <div className="mt-4 space-y-6">
        {formFieldGroups.map((group, groupIndex) => (
          <div
            key={group.id}
            className="relative border border-gray-200 rounded-lg p-4"
          >
            {/* 그룹 삭제 버튼 */}
            <button
              type="button"
              onClick={() => removeGroup(group.id)}
              className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 그룹 헤더 */}
            <div className="flex items-center gap-2 mb-4 pr-8">
              <GripVertical className="w-4 h-4 text-gray-300" />
              <span className="text-xs text-gray-400">그룹 {groupIndex + 1}</span>
            </div>

            {/* 그룹 정보 입력 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  그룹명<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={group.groupTitle}
                  onChange={(e) =>
                    updateGroup(group.id, 'groupTitle', e.target.value)
                  }
                  placeholder="예: 개인정보 수집 동의"
                  className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  유형<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={group.isRequired ? '필수' : '옵션'}
                    onChange={(e) =>
                      updateGroup(group.id, 'isRequired', e.target.value === '필수')
                    }
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white appearance-none pr-10 text-gray-700"
                  >
                    <option value="필수">필수</option>
                    <option value="옵션">옵션</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* 그룹 설명 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                설명
              </label>
              <textarea
                value={group.groupDescription || ''}
                onChange={(e) =>
                  updateGroup(group.id, 'groupDescription', e.target.value)
                }
                placeholder="예: 개인정보 보호법에 따른 동의서입니다."
                rows={2}
                className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* 필드 목록 */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">입력 필드</p>
              <div className="space-y-4">
                {group.fields.map((field, fieldIndex) => (
                  <FieldEditor
                    key={field.id}
                    field={field}
                    fieldIndex={fieldIndex}
                    canDelete={group.fields.length > 1}
                    onUpdate={(fieldKey, value) =>
                      updateField(group.id, field.id, fieldKey, value)
                    }
                    onRemove={() => removeField(group.id, field.id)}
                    onAddOption={() => addOption(group.id, field.id)}
                    onUpdateOption={(optionIndex, value) =>
                      updateOption(group.id, field.id, optionIndex, value)
                    }
                    onRemoveOption={(optionIndex) =>
                      removeOption(group.id, field.id, optionIndex)
                    }
                  />
                ))}
              </div>

              {/* 필드 추가 버튼 */}
              <button
                type="button"
                onClick={() => addField(group.id)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                필드 추가
              </button>
            </div>
          </div>
        ))}

        {/* 그룹 추가 버튼 */}
        <IconButton
          type="button"
          variant="secondary"
          icon={<Plus className="w-4 h-4" />}
          onClick={addGroup}
          className="w-full"
        >
          그룹 추가
        </IconButton>
      </div>
    </>
  );
}

// ============================================================================
// FieldEditor 하위 컴포넌트
// ============================================================================

interface FieldEditorProps {
  field: FormFieldData;
  fieldIndex: number;
  canDelete: boolean;
  onUpdate: (field: keyof FormFieldData, value: string | boolean | number | string[]) => void;
  onRemove: () => void;
  onAddOption: () => void;
  onUpdateOption: (optionIndex: number, value: string) => void;
  onRemoveOption: (optionIndex: number) => void;
}

function FieldEditor({
  field,
  fieldIndex,
  canDelete,
  onUpdate,
  onRemove,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: FieldEditorProps) {
  const fieldTypes = Object.entries(FORM_FIELD_TYPE_LABELS) as [FormFieldType, string][];

  return (
    <div className="relative p-3 bg-gray-50 rounded-lg">
      {/* 필드 삭제 버튼 */}
      {canDelete && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="flex items-center gap-2 mb-3 pr-6">
        <span className="text-xs text-gray-400">필드 {fieldIndex + 1}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 레이블 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            레이블<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={field.fieldLabel}
            onChange={(e) => onUpdate('fieldLabel', e.target.value)}
            placeholder="예: 생년월일"
            className="w-full px-2.5 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
          />
        </div>

        {/* 타입 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            타입<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={field.fieldType}
              onChange={(e) => {
                const newType = e.target.value as FormFieldType;
                onUpdate('fieldType', newType);
                // 타입 변경 시 placeholder 초기화
                onUpdate('placeholder', FORM_FIELD_TYPE_PLACEHOLDERS[newType]);
                // radio로 변경 시 기본 선택지 추가
                if (requiresOptions(newType) && (!field.options || field.options.length === 0)) {
                  onUpdate('options', ['옵션 1', '옵션 2']);
                }
              }}
              className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white appearance-none pr-8 text-gray-700"
            >
              {fieldTypes.map(([type, label]) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* 필수 여부 */}
        <div className="flex items-end pb-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`required-${field.id}`}
              checked={field.isRequired}
              onCheckedChange={(checked) => onUpdate('isRequired', checked as boolean)}
            />
            <label
              htmlFor={`required-${field.id}`}
              className="text-sm text-gray-700 cursor-pointer select-none"
            >
              필수
            </label>
          </div>
        </div>
      </div>

      {/* 플레이스홀더 (체크박스일 때만 표시) */}
      {field.fieldType === 'CHECKBOX' && (
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            체크박스 텍스트
          </label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => onUpdate('placeholder', e.target.value)}
            placeholder="예: 위 내용에 동의합니다"
            className="w-full px-2.5 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
      )}

      {/* 선택지 (radio 타입일 때만 표시) */}
      {requiresOptions(field.fieldType) && (
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            선택지
          </label>
          <div className="space-y-2">
            {(field.options || []).map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4">{optionIndex + 1}.</span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => onUpdateOption(optionIndex, e.target.value)}
                  placeholder={`선택지 ${optionIndex + 1}`}
                  className="flex-1 px-2.5 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
                {(field.options?.length || 0) > 2 && (
                  <button
                    type="button"
                    onClick={() => onRemoveOption(optionIndex)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={onAddOption}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              선택지 추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
