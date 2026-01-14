'use client';

import { useState } from 'react';
import { Plus, X, FileText, ChevronDown, Paperclip, Loader2 } from 'lucide-react';
import type { DocumentRequirement, TemplateFile } from '@/lib/types/document';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { IconButton } from '@/components/shared/IconButton';
import { SectionHeader } from '@/components/shared/SectionHeader';
import FileUploadDialog from '@/components/submit/upload/FileUploadDialog';

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
      // 각 파일을 순차적으로 처리
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
    // 부모에 삭제 알림 (S3 삭제 등 처리)
    onTemplateFileRemove?.(requirementId, index);

    // 로컬 상태에서 제거
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
    <Card variant="compact" className="mb-6">
      <CardHeader variant="compact">
        <CardTitle>
          <SectionHeader icon={FileText} title="수집 서류 등록" size="md" />
        </CardTitle>
      </CardHeader>

      <CardContent variant="compact">
        <div className="space-y-4">
          {requirements.map((requirement) => (
            <div
              key={requirement.id}
              className="relative border border-gray-200 rounded-lg p-4"
            >
              {/* 삭제 버튼 (서류가 2개 이상일 때만 표시) */}
              {requirements.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRequirement(requirement.id)}
                  className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* 서류명 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    서류명<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={requirement.name}
                    onChange={(e) =>
                      updateRequirement(requirement.id, 'name', e.target.value)
                    }
                    placeholder="예: 주민등록등본"
                    className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                    required
                  />
                </div>

                {/* 서류 유형 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    서류 유형<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={requirement.type}
                      onChange={(e) =>
                        updateRequirement(requirement.id, 'type', e.target.value)
                      }
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white appearance-none pr-10 text-gray-700"
                      required
                    >
                      <option value="필수">필수</option>
                      <option value="옵션">옵션</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 서류 설명 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  설명
                </label>
                <textarea
                  value={requirement.description}
                  onChange={(e) =>
                    updateRequirement(requirement.id, 'description', e.target.value)
                  }
                  placeholder="예: 3개월 이내 발급"
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 resize-none"
                />
              </div>

              {/* 복수 파일 허용 체크박스 */}
              <div className="flex items-center gap-2 mt-3">
                <Checkbox
                  id={`multiple-${requirement.id}`}
                  checked={requirement.allowMultiple ?? false}
                  onCheckedChange={(checked) =>
                    updateRequirement(requirement.id, 'allowMultiple', checked as boolean)
                  }
                />
                <label
                  htmlFor={`multiple-${requirement.id}`}
                  className="text-sm text-gray-700 cursor-pointer select-none"
                >
                  받을 파일이 여러 개예요
                </label>
              </div>

              {/* 양식 파일 영역 - 배경 없이 심플하게 */}
              <div className="mt-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>양식 파일</span>
                  </div>
                  {/* 양식 첨부 버튼 - 왼쪽에 배치 */}
                  <button
                    type="button"
                    onClick={() => openFileDialog(requirement.id)}
                    className="text-xs text-gray-500 font-semibold hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    + 첨부
                  </button>
                  {uploadingTemplateIds.includes(requirement.id) && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>업로드 중...</span>
                    </div>
                  )}
                </div>

                {/* 파일 목록 - 아래에 순차적으로 */}
                {requirement.templates && requirement.templates.length > 0 && (
                  <div className="space-y-1 pl-5">
                    {requirement.templates.map((template: TemplateFile, index: number) => (
                      <div
                        key={`${template.s3Key}-${index}`}
                        className="flex items-center gap-2 group"
                      >
                        {onTemplatePreview ? (
                          <button
                            type="button"
                            onClick={() => onTemplatePreview(requirement.id, template)}
                            className="text-sm text-gray-500 hover:text-gray-700 hover:underline truncate text-left"
                          >
                            {template.filename}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-500 truncate">
                            {template.filename}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleTemplateRemove(requirement.id, index)}
                          className="text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          ))}

          {/* 서류 추가 버튼 */}
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
      </CardContent>

      {/* 파일 업로드 다이얼로그 (멀티 파일 지원) */}
      <FileUploadDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="양식 파일 업로드"
        multiple
        onFilesSelect={handleFilesSelect}
      />
    </Card>
  );
}
