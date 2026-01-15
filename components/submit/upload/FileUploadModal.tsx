'use client';

import { useState, useCallback } from 'react';
import { X, FileText } from 'lucide-react';
import JSZip from 'jszip';
import { Button } from '@/components/ui/Button';
import { FileDropZone } from '@/components/shared/FileDropZone';
import { useFileDrop } from '@/lib/hooks/useFileDrop';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  /** 업로드 버튼 클릭 시 호출 (검증 완료된 파일) */
  onFileSelect: (file: File) => void;
}

// 위험한 실행 파일 확장자 블랙리스트
const BLOCKED_EXTENSIONS = [
  'exe', 'sh', 'bat', 'cmd', 'ps1', 'vbs', 'js', 'jar', 'msi', 'scr', 'com', 'pif',
  'hta', 'cpl', 'msc', 'gadget', 'inf', 'reg', 'lnk', 'ws', 'wsf', 'wsc', 'wsh',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

// 파일 유효성 검사
const validateFile = async (file: File): Promise<string | null> => {
  // 파일 크기 체크
  if (file.size > MAX_FILE_SIZE) {
    return '파일 크기는 10MB 이하여야 합니다.';
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
 * 파일 업로드 모달
 *
 * 파일 선택 및 유효성 검사 담당
 * 실제 업로드는 부모 컴포넌트(DocumentUploadItem)에서 처리
 *
 * 흐름: 파일 선택 → 선택된 파일 확인 → "업로드" 버튼 클릭 → 모달 닫힘 + 업로드 시작
 */
export default function FileUploadModal({
  isOpen,
  onClose,
  documentTitle: _documentTitle, // Reserved for future use
  onFileSelect,
}: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // 파일 선택 시 유효성 검사 후 상태에 저장
  const handleFileValidate = useCallback(async (file: File) => {
    setIsValidating(true);
    setError(null);

    try {
      const validationError = await validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // 유효성 검사 통과 → 선택된 파일로 저장
      setSelectedFile(file);
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
    onFileSelect: handleFileValidate,
    disabled: isValidating,
  });

  // 업로드 버튼 클릭 시 부모에게 파일 전달 후 모달 닫기
  const handleUpload = () => {
    if (!selectedFile) return;
    onFileSelect(selectedFile);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError(null);
    resetInput();
    onClose();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    resetInput();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">파일 업로드하기</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isValidating}
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Drag & Drop Area */}
          <FileDropZone
            isDragging={isDragging}
            disabled={isValidating}
            fileInputRef={fileInputRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onInputChange={handleInputChange}
            onSelectClick={openFilePicker}
            size="sm"
          />

          {/* Selected File - Below drag area */}
          {selectedFile && (
            <div className="flex items-center gap-3 mt-4 p-3 border border-slate-200 rounded-lg">
              <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveFile}
                className="h-6 w-6 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Info Text */}
          <div className="mt-4 space-y-0.5">
            <p className="text-sm text-gray-500">• 최대 파일 크기: 10MB</p>
            <p className="text-xs text-gray-400">• 일부 파일 형식은 업로드가 제한됩니다.</p>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-600 mt-3">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile}
            className="flex-1"
          >
            업로드
          </Button>
        </div>
      </div>
    </div>
  );
}
