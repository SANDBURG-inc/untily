'use client';

import { type DragEvent, type ChangeEvent, type RefObject, type ReactNode } from 'react';
import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FileDropZoneProps {
  /** 드래그 중 여부 */
  isDragging: boolean;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 허용 파일 확장자 (예: ".jpg,.jpeg,.png") */
  accept: string;
  /** 파일 input ref */
  fileInputRef: RefObject<HTMLInputElement | null>;
  /** 드래그 오버 핸들러 */
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  /** 드래그 리브 핸들러 */
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  /** 드롭 핸들러 */
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  /** 파일 input change 핸들러 */
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /** 파일 선택 버튼 클릭 핸들러 */
  onSelectClick: () => void;
  /** 크기 변형 (sm: 작은 모달용, lg: 큰 모달용) */
  size?: 'sm' | 'lg';
  /** 힌트 텍스트 */
  hint?: string;
  /** 미리보기 영역 (파일 선택 후 표시) */
  preview?: ReactNode;
}

/**
 * 파일 드래그 앤 드롭 영역 공통 컴포넌트
 */
export function FileDropZone({
  isDragging,
  disabled = false,
  accept,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onInputChange,
  onSelectClick,
  size = 'lg',
  hint = '파일을 여기에 드래그 하거나, 직접 선택해주세요.',
  preview,
}: FileDropZoneProps) {
  const sizeClasses = {
    sm: 'p-8',
    lg: 'p-8 min-h-[200px]',
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`
        relative flex flex-col items-center justify-center gap-4
        border-2 border-dashed rounded-xl
        bg-slate-100 transition-colors
        ${sizeClasses[size]}
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={onInputChange}
        className="hidden"
        disabled={disabled}
      />

      {preview || (
        <>
          <p className="text-sm text-slate-500 text-center">{hint}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={onSelectClick}
            disabled={disabled}
          >
            파일선택
            <Paperclip size={16} />
          </Button>
        </>
      )}
    </div>
  );
}
