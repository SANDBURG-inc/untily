'use client';

import { useState, useCallback } from 'react';
import { FileText, X, Upload } from 'lucide-react';
import { uploadFile, replaceFile, deleteFile } from '@/lib/s3/upload';
import FileUploadModal from './FileUploadModal';

interface UploadedDocument {
  submittedDocumentId: string;
  filename: string;
  s3Key: string;
  size?: number;
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
  onUploadRemove?: () => void;
}

export default function DocumentUploadItem({
  requiredDocument,
  documentBoxId,
  submitterId,
  existingUpload,
  onUploadComplete,
  onUploadError,
  onUploadRemove,
}: DocumentUploadItemProps) {
  const [upload, setUpload] = useState<UploadedDocument | null>(existingUpload ?? null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

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
          onProgress: setUploadProgress,
        });
      } else {
        // 새 파일 업로드
        result = await uploadFile({
          file,
          documentBoxId,
          submitterId,
          requiredDocumentId: requiredDocument.requiredDocumentId,
          onProgress: setUploadProgress,
        });
      }

      const newUpload: UploadedDocument = {
        submittedDocumentId: result.submittedDocumentId,
        filename: file.name,
        s3Key: result.s3Key,
        size: file.size,
      };

      setUpload(newUpload);
      onUploadComplete?.(newUpload);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.';
      onUploadError?.(errorMsg);
      throw err;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [upload, documentBoxId, submitterId, requiredDocument.requiredDocumentId, onUploadComplete, onUploadError]);

  const handleRemove = async () => {
    if (!upload) return;

    try {
      await deleteFile(upload.submittedDocumentId);
      setUpload(null);
      onUploadRemove?.();
    } catch (err) {
      onUploadError?.(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">{requiredDocument.documentTitle}</h3>
            {requiredDocument.isRequired && (
              <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded">
                필수
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {requiredDocument.documentDescription && (
          <p className="text-sm text-gray-500 mb-4">{requiredDocument.documentDescription}</p>
        )}

        {/* Upload Area */}
        {upload ? (
          // 업로드 완료 상태
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{upload.filename}</p>
              {upload.size && (
                <p className="text-xs text-gray-500">{formatFileSize(upload.size)}</p>
              )}
            </div>
            <button
              onClick={handleRemove}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // 업로드 전 상태
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">파일 업로드하기</span>
          </button>
        )}
      </div>

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        documentTitle={requiredDocument.documentTitle}
        onUpload={handleUpload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />
    </>
  );
}
