'use client';

import { useState, useCallback, useRef } from 'react';
import { uploadFile, replaceFile, deleteFile, classifyUploadError } from '@/lib/s3/upload';
import type { UploadTask } from '@/lib/types/upload';
import FileUploadModal from './FileUploadModal';
import FilePreview from './FilePreview';
import FileUploadButton from './FileUploadButton';
import UploadProgressIndicator from './UploadProgressIndicator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface UploadedDocument {
  submittedDocumentId: string;
  filename: string; // 관리자용 가공 파일명
  originalFilename: string; // 원본 파일명 (UI 표시용)
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

/**
 * 문서 업로드 아이템 컴포넌트
 *
 * 비동기 업로드 방식:
 * - 모달에서 파일 선택 후 즉시 닫힘
 * - DocumentUploadItem에서 업로드 진행 상태 표시
 * - 취소/재시도 기능 지원
 *
 * TODO: 복수 파일 업로드 시 아래 구조로 변경
 * const [uploadTasks, setUploadTasks] = useState<Map<string, UploadTask>>(new Map());
 * - key: task.id (UUID)
 * - 각 파일별 독립적인 진행률/에러 상태 관리
 * - UploadProgressIndicator를 map으로 렌더링
 */
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
  const [isRemoving, setIsRemoving] = useState(false);

  // 비동기 업로드 상태
  const [uploadTask, setUploadTask] = useState<UploadTask | null>(null);

  // 현재 업로드 작업의 AbortController 참조
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 비동기 업로드 시작
   * 모달에서 파일 선택 시 호출됨
   */
  const startUpload = useCallback(async (file: File) => {
    // 새 AbortController 생성
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const taskId = crypto.randomUUID();

    // 업로드 시작 상태 설정
    setUploadTask({
      id: taskId,
      file,
      status: 'uploading',
      progress: 0,
      abortController,
    });

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
          onProgress: (progress) => {
            setUploadTask((prev) => (prev ? { ...prev, progress } : null));
          },
          signal: abortController.signal,
        });
      } else {
        // 새 파일 업로드
        result = await uploadFile({
          file,
          documentBoxId,
          submitterId,
          requiredDocumentId: requiredDocument.requiredDocumentId,
          onProgress: (progress) => {
            setUploadTask((prev) => (prev ? { ...prev, progress } : null));
          },
          signal: abortController.signal,
        });
      }

      // 업로드 성공
      const newUpload: UploadedDocument = {
        submittedDocumentId: result.submittedDocumentId,
        filename: result.filename,
        originalFilename: result.originalFilename,
        s3Key: result.s3Key,
        size: file.size,
      };

      setUploadTask(null);
      setUpload(newUpload);
      onUploadComplete?.(newUpload);
    } catch (err) {
      // 사용자 취소인 경우 에러 표시 안 함
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      // 에러 분류 및 상태 업데이트
      const uploadError = classifyUploadError(err);
      setUploadTask((prev) =>
        prev
          ? {
              ...prev,
              status: 'error',
              error: uploadError,
            }
          : null
      );

      onUploadError?.(uploadError.message);
    } finally {
      abortControllerRef.current = null;
    }
  }, [upload, documentBoxId, submitterId, requiredDocument.requiredDocumentId, onUploadComplete, onUploadError]);

  /**
   * 모달에서 파일 선택 시 호출
   */
  const handleFileSelect = useCallback((file: File) => {
    setIsModalOpen(false);
    startUpload(file);
  }, [startUpload]);

  /**
   * 업로드 취소/삭제
   */
  const handleCancel = useCallback(async () => {
    if (!uploadTask) return;

    // 업로드 중인 경우 AbortController로 중단
    if (uploadTask.status === 'uploading' && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // presigned URL 요청 시 생성된 DB 레코드가 있으면 삭제
    if (uploadTask.submittedDocumentId) {
      try {
        await deleteFile(uploadTask.submittedDocumentId);
      } catch {
        // 삭제 실패해도 UI는 초기화
      }
    }

    setUploadTask(null);
  }, [uploadTask]);

  /**
   * 업로드 재시도
   */
  const handleRetry = useCallback(() => {
    if (uploadTask?.file) {
      startUpload(uploadTask.file);
    }
  }, [uploadTask, startUpload]);

  /**
   * 업로드된 파일 삭제
   */
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
          <p className="text-base text-muted-foreground whitespace-pre-wrap">{requiredDocument.documentDescription}</p>
        )}
      </div>

      {/* Upload Area */}
      {uploadTask ? (
        // 업로드 진행 중 또는 에러 상태
        <UploadProgressIndicator
          task={uploadTask}
          onRetry={handleRetry}
          onCancel={handleCancel}
        />
      ) : upload ? (
        // 업로드 완료 상태
        <FilePreview
          filename={upload.originalFilename}
          size={upload.size}
          onRemove={handleRemove}
          isRemoving={isRemoving}
        />
      ) : (
        // 초기 상태
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
        onFileSelect={handleFileSelect}
      />
    </>
  );
}
