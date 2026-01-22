'use client';

import { useState, useCallback } from 'react';
import { X, FileText } from 'lucide-react';
import JSZip from 'jszip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { FileDropZone } from '@/components/shared/FileDropZone';
import { useFileDrop } from '@/lib/hooks/useFileDrop';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 단일 파일 선택 콜백 (기존 - backward compatible) */
  onFileSelect?: (file: File) => void;
  /** 복수 파일 선택 콜백 (multiple=true 시 사용) */
  onFilesSelect?: (files: File[]) => void;
  /** 복수 파일 허용 여부 (기본: false) */
  multiple?: boolean;
  /** 다이얼로그 제목 (기본값: "파일 업로드하기") */
  title?: string;
}

// 위험한 실행 파일 확장자 블랙리스트
const BLOCKED_EXTENSIONS = [
  'exe', 'sh', 'bat', 'cmd', 'ps1', 'vbs', 'js', 'jar', 'msi', 'scr', 'com', 'pif',
  'hta', 'cpl', 'msc', 'gadget', 'inf', 'reg', 'lnk', 'ws', 'wsf', 'wsc', 'wsh',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (파일당)
const MAX_FILES = 10; // 최대 파일 개수
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB (총 용량)

// 파일 확장자가 차단 목록에 있는지 확인
const isBlockedExtension = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? BLOCKED_EXTENSIONS.includes(ext) : false;
};

// ZIP 파일 내부에 차단된 확장자가 있는지 검사 (중첩 ZIP 포함)
const checkZipContents = async (
  zipData: File | ArrayBuffer,
  depth: number = 0
): Promise<string | null> => {
  // 무한 재귀 방지 (최대 3단계까지)
  if (depth > 3) return null;

  try {
    const zip = await JSZip.loadAsync(zipData);
    const fileEntries = Object.entries(zip.files);

    for (const [filename, zipEntry] of fileEntries) {
      // 차단된 확장자 체크
      if (isBlockedExtension(filename)) {
        return '압축 파일 안에 업로드할 수 없는 파일이 포함되어 있습니다.';
      }

      // 중첩 ZIP 파일 재귀 검사
      const ext = filename.split('.').pop()?.toLowerCase();
      if (ext === 'zip' && !zipEntry.dir) {
        const nestedZipData = await zipEntry.async('arraybuffer');
        const nestedError = await checkZipContents(nestedZipData, depth + 1);
        if (nestedError) return nestedError;
      }
    }

    return null;
  } catch {
    return 'ZIP 파일을 읽는 중 오류가 발생했습니다.';
  }
};

// 파일 유효성 검사 (단일 파일)
const validateFile = async (file: File): Promise<string | null> => {
  // 파일 크기 체크
  if (file.size > MAX_FILE_SIZE) {
    return '파일 크기는 25MB 이하여야 합니다.';
  }

  // 차단된 확장자 체크
  if (isBlockedExtension(file.name)) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return `'.${ext}' 형식의 파일은 업로드할 수 없습니다.`;
  }

  // ZIP 파일인 경우 내부 검사
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'zip') {
    return await checkZipContents(file);
  }

  return null;
};

// 파일 크기 포맷팅
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * 파일 업로드 다이얼로그
 *
 * 파일 선택 및 유효성 검사 담당
 * 실제 업로드는 부모 컴포넌트(DocumentUploadItem)에서 처리
 *
 * 흐름: 파일 선택 → 선택된 파일 확인 → "업로드" 버튼 클릭 → 다이얼로그 닫힘 + 업로드 시작
 *
 * @example
 * // 단일 파일 모드 (기존 방식)
 * <FileUploadDialog onFileSelect={(file) => handleFile(file)} />
 *
 * @example
 * // 멀티 파일 모드
 * <FileUploadDialog multiple onFilesSelect={(files) => handleFiles(files)} />
 */
export default function FileUploadDialog({
  open,
  onOpenChange,
  onFileSelect,
  onFilesSelect,
  multiple = false,
  title = '파일 업로드하기',
}: FileUploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // 상태 초기화
  const resetState = () => {
    setSelectedFiles([]);
    setErrors([]);
    resetInput();
  };

  // 복수 파일 검증 (멀티 모드)
  const validateMultipleFiles = useCallback(
    async (
      files: File[],
      existingFiles: File[]
    ): Promise<{ valid: File[]; errors: string[] }> => {
      const validationErrors: string[] = [];
      const validFiles: File[] = [];

      // 최대 파일 개수 체크
      const totalCount = existingFiles.length + files.length;
      if (totalCount > MAX_FILES) {
        validationErrors.push(`파일은 최대 ${MAX_FILES}개까지 선택 가능합니다.`);
        files = files.slice(0, MAX_FILES - existingFiles.length);
      }

      // 총 용량 체크
      const existingSize = existingFiles.reduce((sum, f) => sum + f.size, 0);
      const newSize = files.reduce((sum, f) => sum + f.size, 0);
      if (existingSize + newSize > MAX_TOTAL_SIZE) {
        validationErrors.push('총 파일 크기는 100MB를 초과할 수 없습니다.');
      }

      // 개별 파일 검증
      for (const file of files) {
        const error = await validateFile(file);
        if (error) {
          validationErrors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      }

      return { valid: validFiles, errors: validationErrors };
    },
    []
  );

  // 멀티 파일 선택 핸들러
  const handleFilesValidate = useCallback(
    async (files: File[]) => {
      setIsValidating(true);
      setErrors([]);

      try {
        const { valid, errors: validationErrors } = await validateMultipleFiles(
          files,
          selectedFiles
        );
        setErrors(validationErrors);

        if (valid.length > 0) {
          // 기존 파일에 추가 (중복 파일명 제거)
          setSelectedFiles((prev) => {
            const existingNames = new Set(prev.map((f) => f.name));
            const newFiles = valid.filter((f) => !existingNames.has(f.name));
            const combined = [...prev, ...newFiles];
            return combined.slice(0, MAX_FILES);
          });
        }
      } finally {
        setIsValidating(false);
      }
    },
    [selectedFiles, validateMultipleFiles]
  );

  // 단일 파일 선택 핸들러 (기존 호환)
  const handleSingleFileValidate = useCallback(async (file: File) => {
    setIsValidating(true);
    setErrors([]);

    try {
      const validationError = await validateFile(file);
      if (validationError) {
        setErrors([validationError]);
        return;
      }

      // 유효성 검사 통과 → 선택된 파일로 저장
      setSelectedFiles([file]);
    } finally {
      setIsValidating(false);
    }
  }, []);

  const {
    isDragging,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleInputChange,
    openFilePicker,
    resetInput,
  } = useFileDrop({
    onFileSelect: multiple ? undefined : handleSingleFileValidate,
    onFilesSelect: multiple ? handleFilesValidate : undefined,
    multiple,
    disabled: isValidating,
  });

  // 업로드 버튼 클릭 시 부모에게 파일 전달 후 다이얼로그 닫기
  const handleUpload = () => {
    if (selectedFiles.length === 0) return;

    if (multiple && onFilesSelect) {
      onFilesSelect(selectedFiles);
    } else if (onFileSelect && selectedFiles[0]) {
      onFileSelect(selectedFiles[0]);
    }

    resetState();
    onOpenChange(false);
  };

  // 개별 파일 제거
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setErrors([]);
    resetInput();
  };

  // 총 파일 크기 계산
  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        // 검증 중에는 닫기 방지
        if (isValidating) return;
        if (!isOpen) resetState();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent
        className="sm:max-w-xl p-6 gap-6 rounded-xl"
        showCloseButton={!isValidating}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4">
          {/* Drag & Drop Area */}
          <FileDropZone
            isDragging={isDragging}
            disabled={isValidating}
            multiple={multiple}
            fileInputRef={fileInputRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onInputChange={handleInputChange}
            onSelectClick={openFilePicker}
            size="md"
            hint={
              multiple
                ? '파일들을 여기에 드래그 하거나, 직접 선택해주세요.'
                : '파일을 여기에 드래그 하거나, 직접 선택해주세요.'
            }
          />

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg"
                >
                  <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(index)}
                    className="h-6 w-6 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {/* 멀티 모드: 총 용량 표시 */}
              {multiple && selectedFiles.length > 1 && (
                <p className="text-xs text-gray-500 text-right">
                  총 {formatFileSize(totalSize)} / 100MB ({selectedFiles.length}
                  개)
                </p>
              )}
            </div>
          )}

          {/* Info Text */}
          <div className="space-y-0.5">
            {multiple ? (
              <>
                <p className="text-sm text-gray-500">
                  • 최대 {MAX_FILES}개 파일, 총 100MB까지
                </p>
                <p className="text-sm text-gray-500">• 파일당 최대 25MB</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">• 최대 파일 크기: 25MB</p>
            )}
            <p className="text-xs text-gray-400">
              • 일부 파일 형식은 업로드가 제한됩니다.
            </p>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-600">
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="grid grid-cols-2 gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => {
              resetState();
              onOpenChange(false);
            }}
            disabled={isValidating}
          >
            취소
          </Button>
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isValidating}
          >
            업로드
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
