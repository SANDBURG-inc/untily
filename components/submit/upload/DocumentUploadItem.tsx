'use client';

import { useState, useCallback } from 'react';
import { uploadFile, replaceFile, deleteFile } from '@/lib/s3/upload';
import FileUploadModal from './FileUploadModal';
import FilePreview from './FilePreview';
import FileUploadButton from './FileUploadButton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface UploadedDocument {
  submittedDocumentId: string;
  filename: string;
  s3Key: string;
  size?: number;
}

export interface RequiredDocumentInfo {
  requiredDocumentId: string;
  documentTitle: string;
  documentDescription: string | null;
  isRequired: boolean;
}

interface DocumentUploadItemProps {
  requiredDocument: RequiredDocumentInfo;
  documentBoxId: string;
  submitterId: string;
  existingUpload?: UploadedDocument | null;
  onUploadComplete?: (upload: UploadedDocument) => void;
  onUploadError?: (error: string) => void;
  onUploadRemove?: () => void;
  showCard?: boolean;
}

export default function DocumentUploadItem({
  requiredDocument,
  documentBoxId,
  submitterId,
  existingUpload,
  onUploadComplete,
  onUploadError,
  onUploadRemove,
  showCard = true,
}: DocumentUploadItemProps) {
  const [upload, setUpload] = useState<UploadedDocument | null>(existingUpload ?? null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRemoving, setIsRemoving] = useState(false);

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
        filename: result.filename,
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

    setIsRemoving(true);
    try {
      await deleteFile(upload.submittedDocumentId);
      setUpload(null);
      onUploadRemove?.();
    } catch (err) {
      onUploadError?.(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setIsRemoving(false);
    }
  };

  const content = (
    <>
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
        {requiredDocument.documentDescription && (
          <p className="text-base text-muted-foreground">{requiredDocument.documentDescription}</p>
        )}
      </div>

      {/* Upload Area */}
      {upload ? (
        <FilePreview
          filename={upload.filename}
          size={upload.size}
          onRemove={handleRemove}
          isRemoving={isRemoving}
        />
      ) : (
        <FileUploadButton onClick={() => setIsModalOpen(true)} />
      )}
    </>
  );

  return (
    <>
      {showCard ? (
        <Card>
          <CardContent>{content}</CardContent>
        </Card>
      ) : (
        <div>{content}</div>
      )}

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
