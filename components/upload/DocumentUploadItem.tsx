'use client';

import { useState, useRef } from 'react';
import { Upload, CheckCircle, X, FileText, Loader2 } from 'lucide-react';
import { uploadFile, replaceFile } from '@/lib/s3/upload';

interface UploadedDocument {
  submittedDocumentId: string;
  filename: string;
  s3Key: string;
}

interface DocumentUploadItemProps {
  requiredDocument: {
    requiredDocumentId: string;
    documentTitle: string;
    documentDescription: string | null;
    isRequired: boolean;
  };
  documentBoxId: string;
  submitterId: string;
  existingUpload?: UploadedDocument | null;
  onUploadComplete?: (upload: UploadedDocument) => void;
  onUploadError?: (error: string) => void;
}

export default function DocumentUploadItem({
  requiredDocument,
  documentBoxId,
  submitterId,
  existingUpload,
  onUploadComplete,
  onUploadError,
}: DocumentUploadItemProps) {
  const [upload, setUpload] = useState<UploadedDocument | null>(existingUpload ?? null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 유효성 검사
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = 'PDF, JPG, PNG 파일만 업로드 가능합니다.';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = '파일 크기는 10MB 이하여야 합니다.';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      let result;

      if (upload) {
        // 기존 파일 교체
        result = await replaceFile({
          file,
          documentBoxId,
          submitterId,
          requiredDocumentId: requiredDocument.requiredDocumentId,
          existingDocumentId: upload.submittedDocumentId,
          onProgress: setProgress,
        });
      } else {
        // 새 파일 업로드
        result = await uploadFile({
          file,
          documentBoxId,
          submitterId,
          requiredDocumentId: requiredDocument.requiredDocumentId,
          onProgress: setProgress,
        });
      }

      const newUpload: UploadedDocument = {
        submittedDocumentId: result.submittedDocumentId,
        filename: file.name,
        s3Key: result.s3Key,
      };

      setUpload(newUpload);
      onUploadComplete?.(newUpload);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.';
      setError(errorMsg);
      onUploadError?.(errorMsg);
    } finally {
      setUploading(false);
      setProgress(0);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      {/* 헤더 */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">{requiredDocument.documentTitle}</h3>
            {requiredDocument.isRequired && (
              <span className="text-xs text-red-500 font-medium">필수</span>
            )}
          </div>
          {requiredDocument.documentDescription && (
            <p className="text-sm text-gray-500 mt-1">{requiredDocument.documentDescription}</p>
          )}
        </div>
        {upload && (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        )}
      </div>

      {/* 업로드 영역 */}
      {upload ? (
        // 업로드 완료 상태
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{upload.filename}</p>
          </div>
          <label className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
            변경
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        </div>
      ) : uploading ? (
        // 업로드 중 상태
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm text-gray-600">업로드 중... {progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        // 업로드 대기 상태
        <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">클릭하여 파일 선택</p>
          <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (최대 10MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
          />
        </label>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
          <X className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
