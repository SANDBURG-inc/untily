'use client';

import { useState, useCallback } from 'react';
import { FileEdit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/shared/IconButton';
import { SaveButton } from '@/components/shared/SaveButton';
import DocumentUploadItem, {
  type UploadedDocument,
  type RequiredDocumentInfo,
} from '@/components/submit/upload/DocumentUploadItem';

interface FileItem {
  requiredDocumentId: string;
  documentTitle: string;
  documentDescription: string | null;
  isRequired: boolean;
  filename: string | null;
  submittedDocumentId?: string;
  size?: number;
}

interface EditableFileListCardProps {
  title: string;
  files: FileItem[];
  documentBoxId: string;
  submitterId: string;
  onFilesChange?: (uploads: Map<string, UploadedDocument>) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function EditableFileListCard({
  title,
  files,
  documentBoxId,
  submitterId,
  onFilesChange,
  onError,
  className = '',
}: EditableFileListCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  // 파일 상태를 Map으로 관리
  const initialUploads = new Map<string, UploadedDocument>();
  files.forEach((file) => {
    if (file.filename && file.submittedDocumentId) {
      initialUploads.set(file.requiredDocumentId, {
        submittedDocumentId: file.submittedDocumentId,
        filename: file.filename,
        s3Key: '',
        size: file.size,
      });
    }
  });

  const [uploadedDocs, setUploadedDocs] = useState<Map<string, UploadedDocument>>(initialUploads);

  const handleUploadComplete = useCallback((requiredDocumentId: string, upload: UploadedDocument) => {
    setUploadedDocs((prev) => {
      const newMap = new Map(prev);
      newMap.set(requiredDocumentId, upload);
      return newMap;
    });
  }, []);

  const handleUploadRemove = useCallback((requiredDocumentId: string) => {
    setUploadedDocs((prev) => {
      const newMap = new Map(prev);
      newMap.delete(requiredDocumentId);
      return newMap;
    });
  }, []);

  const handleUploadError = useCallback((errorMsg: string) => {
    onError?.(errorMsg);
  }, [onError]);

  const handleSave = () => {
    onFilesChange?.(uploadedDocs);
    setIsEditing(false);
  };

  // 보기 모드
  if (!isEditing) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <IconButton
              variant="outline"
              size="sm"
              icon={<FileEdit className="w-4 h-4" />}
              onClick={() => setIsEditing(true)}
              aria-label="파일 수정하기"
            >
              파일수정
            </IconButton>
          </div>

          <ul className="space-y-3" role="list">
            {files.map((file) => {
              const uploaded = uploadedDocs.get(file.requiredDocumentId);
              return (
                <li
                  key={file.requiredDocumentId}
                  className="border border-border rounded-lg px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-medium text-foreground mb-0.5">
                        {file.documentTitle}
                      </p>
                      {uploaded?.filename ? (
                        <p className="text-base text-muted-foreground truncate">
                          {uploaded.filename}
                        </p>
                      ) : (
                        <p className="text-base text-muted-foreground/60 italic">
                          파일 없음
                        </p>
                      )}
                    </div>
                    <Badge variant={file.isRequired ? 'required' : 'optional'}>
                      {file.isRequired ? '필수서류' : '선택'}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    );
  }

  // 편집 모드
  return (
    <Card className={className}>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <SaveButton onClick={handleSave} />
        </div>

        <div className="space-y-4">
          {files.map((file) => {
            const existingUpload = uploadedDocs.get(file.requiredDocumentId);
            const requiredDocument: RequiredDocumentInfo = {
              requiredDocumentId: file.requiredDocumentId,
              documentTitle: file.documentTitle,
              documentDescription: file.documentDescription,
              isRequired: file.isRequired,
            };

            return (
              <div
                key={file.requiredDocumentId}
                className="border border-border rounded-lg p-4"
              >
                <DocumentUploadItem
                  requiredDocument={requiredDocument}
                  documentBoxId={documentBoxId}
                  submitterId={submitterId}
                  existingUpload={existingUpload}
                  onUploadComplete={(upload) => handleUploadComplete(file.requiredDocumentId, upload)}
                  onUploadError={handleUploadError}
                  onUploadRemove={() => handleUploadRemove(file.requiredDocumentId)}
                  showCard={false}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
