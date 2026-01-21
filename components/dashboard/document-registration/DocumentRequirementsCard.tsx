'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { DocumentRequirement, TemplateFile } from '@/lib/types/document';
import { IconButton } from '@/components/shared/IconButton';
import FileUploadDialog from '@/components/submit/upload/FileUploadDialog';
import { DocumentRequirementItem } from './document-requirements';
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

interface DocumentRequirementsCardProps {
  /** 서류 요구사항 목록 */
  requirements: DocumentRequirement[];
  /** 서류 요구사항 목록 변경 핸들러 */
  onRequirementsChange: (requirements: DocumentRequirement[]) => void;
  /** 양식 파일 선택 핸들러 (생성 모드에서 지연 업로드용) */
  onTemplateFileSelect?: (requirementId: string, file: File) => void;
  /** 양식 파일 삭제 핸들러 */
  onTemplateFileRemove?: (requirementId: string, index: number) => void;
  /** 양식 파일 업로드 중인 항목 ID 목록 */
  uploadingTemplateIds?: string[];
  /** 양식 파일 미리보기 핸들러 (edit 모드에서 사용) */
  onTemplatePreview?: (requirementId: string, template: TemplateFile) => void;
}

/**
 * DocumentRequirementsCard 컴포넌트
 *
 * 수집할 서류 정보를 등록하는 카드 컴포넌트입니다.
 * 서류명, 유형(필수/옵션), 설명, 양식 파일(여러 개)을 입력받습니다.
 * 드래그 앤 드롭으로 서류 순서를 변경할 수 있습니다.
 * SectionHeader는 부모 CollapsibleSection에서 렌더링합니다.
 */
export function DocumentRequirementsCard({
  requirements,
  onRequirementsChange,
  onTemplateFileSelect,
  onTemplateFileRemove,
  uploadingTemplateIds = [],
  onTemplatePreview,
}: DocumentRequirementsCardProps) {
  // 파일 업로드 다이얼로그 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeRequirementId, setActiveRequirementId] = useState<string | null>(null);

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동 후 드래그 시작
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
      const oldIndex = requirements.findIndex((r) => r.id === active.id);
      const newIndex = requirements.findIndex((r) => r.id === over.id);
      onRequirementsChange(arrayMove(requirements, oldIndex, newIndex));
    }
  };

  /**
   * 파일 업로드 다이얼로그 열기
   */
  const openFileDialog = (requirementId: string) => {
    setActiveRequirementId(requirementId);
    setIsDialogOpen(true);
  };

  /**
   * 복수 파일 선택 완료 핸들러
   */
  const handleFilesSelect = (files: File[]) => {
    if (activeRequirementId) {
      files.forEach((file) => {
        onTemplateFileSelect?.(activeRequirementId, file);
      });
    }
    setActiveRequirementId(null);
  };

  /**
   * 새 서류 요구사항 추가
   */
  const addRequirement = () => {
    const newRequirement: DocumentRequirement = {
      id: Date.now().toString(),
      name: '',
      type: '필수',
      description: '',
      templates: [],
      allowMultiple: false,
    };
    onRequirementsChange([...requirements, newRequirement]);
  };

  /**
   * 서류 요구사항 업데이트
   */
  const updateRequirement = (
    id: string,
    field: keyof DocumentRequirement,
    value: string | boolean
  ) => {
    onRequirementsChange(
      requirements.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  /**
   * 서류 요구사항 삭제
   */
  const removeRequirement = (id: string) => {
    onRequirementsChange(requirements.filter((r) => r.id !== id));
  };

  /**
   * 양식 파일 삭제 핸들러
   */
  const handleTemplateRemove = (requirementId: string, index: number) => {
    onTemplateFileRemove?.(requirementId, index);

    onRequirementsChange(
      requirements.map((r) => {
        if (r.id === requirementId && r.templates) {
          const newTemplates = [...r.templates];
          newTemplates.splice(index, 1);
          return { ...r, templates: newTemplates };
        }
        return r;
      })
    );
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={requirements.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {requirements.map((requirement) => (
              <DocumentRequirementItem
                key={requirement.id}
                requirement={requirement}
                canDelete={requirements.length > 1}
                onUpdate={(field, value) =>
                  updateRequirement(requirement.id, field, value)
                }
                onRemove={() => removeRequirement(requirement.id)}
                onOpenFileDialog={() => openFileDialog(requirement.id)}
                onTemplateRemove={(index) =>
                  handleTemplateRemove(requirement.id, index)
                }
                isUploading={uploadingTemplateIds.includes(requirement.id)}
                onTemplatePreview={
                  onTemplatePreview
                    ? (template) => onTemplatePreview(requirement.id, template)
                    : undefined
                }
              />
            ))}

            {/* 서류 추가 버튼 */}
            <div className="pt-2">
              <IconButton
                type="button"
                variant="secondary"
                icon={<Plus className="w-4 h-4" />}
                onClick={addRequirement}
                className="w-full"
              >
                서류 추가
              </IconButton>
            </div>
          </div>
        </SortableContext>
      </DndContext>

      {/* 파일 업로드 다이얼로그 (멀티 파일 지원) */}
      <FileUploadDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="양식 파일 업로드"
        multiple
        onFilesSelect={handleFilesSelect}
      />
    </>
  );
}
