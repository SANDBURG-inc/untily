'use client';

import { Plus } from 'lucide-react';
import { IconButton } from '@/components/shared/IconButton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FormFieldGroupItem } from './form-field-groups';
import { useFormFieldGroups } from '@/lib/hooks/useFormFieldGroups';
import type { FormFieldGroupData } from '@/lib/types/form-field';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

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
 * 드래그 앤 드롭으로 그룹 순서를 변경할 수 있습니다.
 * SectionHeader는 부모 CollapsibleSection에서 렌더링합니다.
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

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * 드래그 종료 핸들러
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = formFieldGroups.findIndex((g) => g.id === active.id);
      const newIndex = formFieldGroups.findIndex((g) => g.id === over.id);
      onFormFieldGroupsChange(arrayMove(formFieldGroups, oldIndex, newIndex));
    }
  };

  // 그룹이 없으면 추가 버튼만 표시
  if (formFieldGroups.length === 0) {
    return (
      <div>
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
    );
  }

  return (
    <>
      {/* 표시 위치 설정 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-normal text-gray-700 mb-3">
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={formFieldGroups.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-6">
            {formFieldGroups.map((group, groupIndex) => (
              <FormFieldGroupItem
                key={group.id}
                group={group}
                groupIndex={groupIndex}
                onUpdateGroup={(field, value) => updateGroup(group.id, field, value)}
                onRemoveGroup={() => removeGroup(group.id)}
                onAddField={() => addField(group.id)}
                onUpdateField={(fieldId, fieldKey, value) =>
                  updateField(group.id, fieldId, fieldKey, value)
                }
                onChangeFieldType={(fieldId, newType, options) =>
                  changeFieldType(group.id, fieldId, newType, options)
                }
                onRemoveField={(fieldId) => removeField(group.id, fieldId)}
                onAddOption={(fieldId) => addOption(group.id, fieldId)}
                onUpdateOption={(fieldId, optionIndex, value) =>
                  updateOption(group.id, fieldId, optionIndex, value)
                }
                onRemoveOption={(fieldId, optionIndex) =>
                  removeOption(group.id, fieldId, optionIndex)
                }
              />
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
        </SortableContext>
      </DndContext>
    </>
  );
}
