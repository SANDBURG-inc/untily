'use client';

import { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from 'react';

interface UseFileDropOptions {
  /** 단일 파일 선택 콜백 (기존 - backward compatible) */
  onFileSelect?: (file: File) => void;
  /** 복수 파일 선택 콜백 (multiple=true 시 사용) */
  onFilesSelect?: (files: File[]) => void;
  /** 복수 파일 허용 여부 */
  multiple?: boolean;
  disabled?: boolean;
}

interface UseFileDropReturn {
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleDragOver: (e: DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: DragEvent<HTMLDivElement>) => void;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  openFilePicker: () => void;
  resetInput: () => void;
}

/**
 * 파일 드래그 앤 드롭 상태 관리 훅
 *
 * @example
 * // 단일 파일 모드 (기존 방식)
 * useFileDrop({ onFileSelect: (file) => console.log(file) })
 *
 * @example
 * // 멀티 파일 모드
 * useFileDrop({
 *   multiple: true,
 *   onFilesSelect: (files) => console.log(files)
 * })
 */
export function useFileDrop({
  onFileSelect,
  onFilesSelect,
  multiple = false,
  disabled = false,
}: UseFileDropOptions): UseFileDropReturn {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files || []);

      if (multiple && onFilesSelect && files.length > 0) {
        // 멀티 파일 모드: 모든 파일 전달
        onFilesSelect(files);
      } else if (files[0] && onFileSelect) {
        // 단일 파일 모드: 첫 번째 파일만 전달 (backward compatible)
        onFileSelect(files[0]);
      }
    },
    [disabled, multiple, onFileSelect, onFilesSelect]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);

      if (multiple && onFilesSelect && files.length > 0) {
        // 멀티 파일 모드
        onFilesSelect(files);
      } else if (files[0] && onFileSelect) {
        // 단일 파일 모드 (backward compatible)
        onFileSelect(files[0]);
      }
    },
    [multiple, onFileSelect, onFilesSelect]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const resetInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return {
    isDragging,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleInputChange,
    openFilePicker,
    resetInput,
  };
}
