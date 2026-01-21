'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Paperclip, Loader2, GripVertical } from 'lucide-react';
import type { DocumentRequirement, TemplateFile } from '@/lib/types/document';
import { Checkbox } from '@/components/ui/checkbox';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DocumentRequirementItemProps {
  /** 서류 요구사항 데이터 */
  requirement: DocumentRequirement;
  /** 삭제 가능 여부 (2개 이상일 때만 삭제 가능) */
  canDelete: boolean;
  /** 요구사항 업데이트 핸들러 */
  onUpdate: (field: keyof DocumentRequirement, value: string | boolean) => void;
  /** 요구사항 삭제 핸들러 */
  onRemove: () => void;
  /** 양식 파일 업로드 다이얼로그 열기 핸들러 */
  onOpenFileDialog: () => void;
  /** 양식 파일 삭제 핸들러 */
  onTemplateRemove: (index: number) => void;
  /** 업로드 중 여부 */
  isUploading: boolean;
  /** 양식 파일 미리보기 핸들러 */
  onTemplatePreview?: (template: TemplateFile) => void;
}

/**
 * DocumentRequirementItem 컴포넌트
 *
 * 개별 서류 요구사항을 표시하는 컴포넌트입니다.
 * 드래그 앤 드롭으로 순서 변경이 가능합니다.
 */
export function DocumentRequirementItem({
  requirement,
  canDelete,
  onUpdate,
  onRemove,
  onOpenFileDialog,
  onTemplateRemove,
  isUploading,
  onTemplatePreview,
}: DocumentRequirementItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // @dnd-kit sortable 훅
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: requirement.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 컨테이너 내부 포커스 감지
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocusIn = () => setIsFocused(true);
    const handleFocusOut = (e: FocusEvent) => {
      // 포커스가 컨테이너 외부로 이동했는지 확인
      if (!container.contains(e.relatedTarget as Node)) {
        setIsFocused(false);
      }
    };

    container.addEventListener('focusin', handleFocusIn);
    container.addEventListener('focusout', handleFocusOut);

    return () => {
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const showDragHandle = isHovered || isFocused || isDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative"
    >
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative border border-gray-200 rounded-lg p-4 transition-all ${
          isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''
        }`}
      >
        {/* 드래그 핸들 - 중앙 상단에 위치, hover/focus 시에만 표시 */}
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-200 ${
            showDragHandle ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            type="button"
            className="p-1 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5 text-gray-300 hover:text-gray-400 rotate-90" />
          </button>
        </div>

        {/* 삭제 버튼 */}
        {canDelete && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
          {/* 서류명 입력 */}
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-2">
              서류명<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={requirement.name}
              onChange={(e) => onUpdate('name', e.target.value)}
              placeholder="예: 주민등록등본"
              className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
              required
            />
          </div>

          {/* 서류 유형 선택 */}
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-2">
              서류 유형<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={requirement.type}
                onChange={(e) => onUpdate('type', e.target.value)}
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
        <div className="pr-8">
          <label className="block text-sm font-normal text-gray-700 mb-2">
            설명
          </label>
          <textarea
            value={requirement.description}
            onChange={(e) => onUpdate('description', e.target.value)}
            placeholder="예: 3개월 이내 발급"
            rows={2}
            className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 resize-none"
          />
        </div>

        {/* 복수 파일 허용 체크박스 */}
        <div className="flex items-center gap-2 mt-3">
          <Checkbox
            id={`multiple-${requirement.id}`}
            checked={requirement.allowMultiple ?? false}
            onCheckedChange={(checked) =>
              onUpdate('allowMultiple', checked as boolean)
            }
          />
          <label
            htmlFor={`multiple-${requirement.id}`}
            className="text-sm text-gray-700 cursor-pointer select-none"
          >
            복수 업로드 허용
          </label>
        </div>

        {/* 양식 파일 영역 */}
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Paperclip className="w-3.5 h-3.5" />
              <span>양식 파일</span>
            </div>
            <button
              type="button"
              onClick={onOpenFileDialog}
              className="text-xs text-gray-500 font-semibold hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded transition-colors"
            >
              + 첨부
            </button>
            {isUploading && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>업로드 중...</span>
              </div>
            )}
          </div>

          {/* 파일 목록 */}
          {requirement.templates && requirement.templates.length > 0 && (
            <div className="space-y-1 pl-5">
              {requirement.templates.map((template: TemplateFile, templateIndex: number) => (
                <div
                  key={`${template.s3Key}-${templateIndex}`}
                  className="flex items-center gap-2 group"
                >
                  {onTemplatePreview ? (
                    <button
                      type="button"
                      onClick={() => onTemplatePreview(template)}
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
                    onClick={() => onTemplateRemove(templateIndex)}
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
    </div>
  );
}
