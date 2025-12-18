'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Loader2, Paperclip, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function FileUploadModal({
  isOpen,
  onClose,
  documentTitle: _documentTitle, // Reserved for future use
  onUpload,
  isUploading,
  uploadProgress,
}: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'PDF, JPG, PNG, DOC, DOCX 파일만 업로드 가능합니다.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return '파일 크기는 10MB 이하여야 합니다.';
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await onUpload(selectedFile);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setError(null);
    onClose();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
            disabled={isUploading}
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Uploading State */}
          {isUploading ? (
            <div className="border-2 border-gray-200 rounded-xl p-8">
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-sm text-gray-600 mb-2">업로드 중...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <>
              {/* Drag & Drop Area - Always visible */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 bg-blue-50 hover:border-gray-400'
                }`}
              >
                <p className="text-md text-gray-600 mb-4">
                  파일을 여기에 드래그 하거나 직접 선택해주세요.
                </p>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
                  파일선택
                  <Paperclip className="w-4 h-4" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={ALLOWED_EXTENSIONS}
                    onChange={handleInputChange}
                  />
                </label>
              </div>

              {/* Selected File - Below drag area */}
              {selectedFile && (
                <div className="flex items-center gap-3 mt-4 p-3 border border-gray-200 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="h-6 w-6 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Info Text - Bullet list */}
          <div className="mt-4 space-y-1 text-sm text-gray-500">
            <p>• 최대 파일 크기: 10MB</p>
            <p>• 지원 형식: PDF, JPG, PNG, DOC, DOCX</p>
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
            disabled={isUploading}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex-1"
          >
            업로드
          </Button>
        </div>
      </div>
    </div>
  );
}
