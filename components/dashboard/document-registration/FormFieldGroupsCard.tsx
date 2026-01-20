'use client';

import { Plus, X, FileEdit, GripVertical } from 'lucide-react';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { IconButton } from '@/components/shared/IconButton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FieldEditor, GroupRequiredSelect } from './form-field-groups';
import { useFormFieldGroups } from '@/lib/hooks/useFormFieldGroups';
import type { FormFieldGroupData } from '@/lib/types/form-field';

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
  // 커스텀 훅으로 상태 관리 로직 분리
  const {
    addGroup,
    removeGroup,
    updateGroup,
    addField,
    removeField,
    updateField,
    changeFieldType,
    addOption,
    updateOption,
    removeOption,
  } = useFormFieldGroups(formFieldGroups, onFormFieldGroupsChange);

  // 그룹이 없으면 추가 버튼만 표시
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
                <GroupRequiredSelect
                  value={group.isRequired}
                  onValueChange={(isRequired) =>
                    updateGroup(group.id, 'isRequired', isRequired)
                  }
                />
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
                    onChangeType={(newType) =>
                      changeFieldType(group.id, field.id, newType, field.options)
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
