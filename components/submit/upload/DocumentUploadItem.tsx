'use client';

import { useState, useCallback } from 'react';
import { X, Upload, File } from 'lucide-react';
import { uploadFile, replaceFile, deleteFile } from '@/lib/s3/upload';
import FileUploadModal from './FileUploadModal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';

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
        filename: result.filename, // 서류명_날짜_제출자이름.확장자 형식
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
      <Card>
        <CardContent>
          {/* Header */}
          <div className="items-start mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-foreground">{requiredDocument.documentTitle}</h3>
              {requiredDocument.isRequired && (
                <Badge variant="required">필수서류</Badge>
              )}
              {!requiredDocument.isRequired && (
                <Badge variant="optional">선택</Badge>
              )}
            </div>
            {/* Description */}
            {requiredDocument.documentDescription && (
              <p className="text-base text-muted-foreground">{requiredDocument.documentDescription}</p>
            )}
          </div>
          
          {/* Upload Area */}
          {upload ? (
            // 업로드 완료 상태
            <div className="flex items-center gap-3 border border-border rounded-md p-3">
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <File className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-md font-medium text-foreground truncate">{upload.filename}</p>
                {upload.size && (
                  <p className="text-xs text-muted-foreground">{formatFileSize(upload.size)}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            // 업로드 전 상태
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsModalOpen(true)}
            >
              파일 업로드하기
              <Upload className="w-4 h-4" />
            </Button>
          )}
        </CardContent>
      </Card>

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
