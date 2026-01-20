'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { uploadFile, deleteFile, classifyUploadError } from '@/lib/s3/upload';
import type { UploadTask } from '@/lib/types/upload';
import FileUploadDialog from './FileUploadDialog';
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

/** 양식 파일 정보 */
interface TemplateFile {
  s3Key: string;
  filename: string;
}

export interface RequiredDocumentInfo {
  requiredDocumentId: string;
  documentTitle: string;
  documentDescription: string | null;
  isRequired: boolean;
  // 양식 파일 목록 (여러 개 가능)
  templates?: TemplateFile[];
  // 양식 ZIP 파일 S3 키 (2개 이상일 때 미리 생성됨)
  templateZipKey?: string | null;
  // 복수 파일 업로드 허용 여부
  allowMultipleFiles?: boolean;
}

interface DocumentUploadItemProps {
  requiredDocument: RequiredDocumentInfo;
  documentBoxId: string;
  submitterId: string;
  /** 기존 업로드 파일 목록 (복수 파일 지원) */
  existingUploads?: UploadedDocument[];
  /** 업로드 목록 변경 시 콜백 */
  onUploadsChange?: (uploads: UploadedDocument[]) => void;
  onUploadError?: (error: string) => void;
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
 * 복수 파일 업로드 지원:
 * - allowMultipleFiles가 true일 때 여러 파일 업로드 가능
 * - 각 파일별 독립적인 진행률/에러 상태 관리
 */
export default function DocumentUploadItem({
  requiredDocument,
  documentBoxId,
  submitterId,
  existingUploads = [],
  onUploadsChange,
  onUploadError,
  showCard = true,
}: DocumentUploadItemProps) {
  // 업로드된 파일 목록
  const [uploads, setUploads] = useState<UploadedDocument[]>(existingUploads);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  // 복수 파일 업로드 작업 관리 (key: taskId)
  const [uploadTasks, setUploadTasks] = useState<Map<string, UploadTask>>(new Map());

  // 삭제 중인 파일 ID 목록
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // AbortController 참조 (taskId별)
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // 복수 파일 모드 여부
  const isMultipleMode = requiredDocument.allowMultipleFiles ?? false;

  // 초기 렌더링 여부 추적 (useEffect에서 초기 호출 방지)
  const isFirstRender = useRef(true);

  // onUploadsChange를 ref로 관리 (dependency에서 제외하여 무한 루프 방지)
  const onUploadsChangeRef = useRef(onUploadsChange);
  onUploadsChangeRef.current = onUploadsChange;

  // uploads 변경 시 부모에게 알림 (초기 렌더링 제외)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onUploadsChangeRef.current?.(uploads);
  }, [uploads]);

  /**
   * 업로드 목록 업데이트 및 부모에 알림
   */
  const updateUploads = useCallback((newUploads: UploadedDocument[]) => {
    setUploads(newUploads);
  }, []);

  /**
   * 비동기 업로드 시작
   */
  const startUpload = useCallback(async (file: File) => {
    const abortController = new AbortController();
    const taskId = crypto.randomUUID();

    abortControllersRef.current.set(taskId, abortController);

    // 업로드 작업 추가
    setUploadTasks((prev) => {
      const newMap = new Map(prev);
      newMap.set(taskId, {
        id: taskId,
        file,
        status: 'uploading',
        progress: 0,
        abortController,
      });
      return newMap;
    });

    try {
      const result = await uploadFile({
        file,
        documentBoxId,
        submitterId,
        requiredDocumentId: requiredDocument.requiredDocumentId,
        onProgress: (progress) => {
          setUploadTasks((prev) => {
            const newMap = new Map(prev);
            const task = newMap.get(taskId);
            if (task) {
              newMap.set(taskId, { ...task, progress });
            }
            return newMap;
          });
        },
        signal: abortController.signal,
      });

      // 업로드 성공
      const newUpload: UploadedDocument = {
        submittedDocumentId: result.submittedDocumentId,
        filename: result.filename,
        originalFilename: result.originalFilename,
        s3Key: result.s3Key,
        size: file.size,
      };

      // 업로드 작업 제거 및 파일 목록에 추가
      setUploadTasks((prev) => {
        const newMap = new Map(prev);
        newMap.delete(taskId);
        return newMap;
      });

      // 단일 파일 모드: 기존 파일 교체, 복수 파일 모드: 추가
      // 함수형 업데이트로 stale closure 문제 방지
      // useEffect에서 부모에게 알림 처리
      setUploads((prev) => {
        return isMultipleMode ? [...prev, newUpload] : [newUpload];
      });
    } catch (err) {
      // 사용자 취소인 경우 에러 표시 안 함
      if (err instanceof Error && err.name === 'AbortError') {
        setUploadTasks((prev) => {
          const newMap = new Map(prev);
          newMap.delete(taskId);
          return newMap;
        });
        return;
      }

      // 에러 분류 및 상태 업데이트
      const uploadError = classifyUploadError(err);
      setUploadTasks((prev) => {
        const newMap = new Map(prev);
        const task = newMap.get(taskId);
        if (task) {
          newMap.set(taskId, { ...task, status: 'error', error: uploadError });
        }
        return newMap;
      });

      onUploadError?.(uploadError.message);
    } finally {
      abortControllersRef.current.delete(taskId);
    }
  }, [documentBoxId, submitterId, requiredDocument.requiredDocumentId, isMultipleMode, onUploadError]);

  /**
   * 단일 파일 선택 시 호출
   */
  const handleFileSelect = useCallback((file: File) => {
    setIsModalOpen(false);
    startUpload(file);
  }, [startUpload]);

  /**
   * 복수 파일 선택 시 호출
   */
  const handleFilesSelect = useCallback((files: File[]) => {
    setIsModalOpen(false);
    files.forEach((file) => startUpload(file));
  }, [startUpload]);

  /**
   * 업로드 작업 취소
   */
  const handleTaskCancel = useCallback(async (taskId: string) => {
    const task = uploadTasks.get(taskId);
    if (!task) return;

    // 업로드 중인 경우 AbortController로 중단
    const controller = abortControllersRef.current.get(taskId);
    if (task.status === 'uploading' && controller) {
      controller.abort();
    }

    // presigned URL 요청 시 생성된 DB 레코드가 있으면 삭제
    if (task.submittedDocumentId) {
      try {
        await deleteFile(task.submittedDocumentId);
      } catch {
        // 삭제 실패해도 UI는 초기화
      }
    }

    setUploadTasks((prev) => {
      const newMap = new Map(prev);
      newMap.delete(taskId);
      return newMap;
    });
  }, [uploadTasks]);

  /**
   * 업로드 작업 재시도
   */
  const handleTaskRetry = useCallback((taskId: string) => {
    const task = uploadTasks.get(taskId);
    if (task?.file) {
      // 기존 작업 제거 후 새로 시작
      setUploadTasks((prev) => {
        const newMap = new Map(prev);
        newMap.delete(taskId);
        return newMap;
      });
      startUpload(task.file);
    }
  }, [uploadTasks, startUpload]);

  /**
   * 양식 파일 다운로드 (개별 파일)
   */
  const handleTemplateDownload = useCallback(async (s3Key: string, filename: string) => {
    setIsDownloadingTemplate(true);
    try {
      const res = await fetch(
        `/api/template/download?s3Key=${encodeURIComponent(s3Key)}&requiredDocumentId=${requiredDocument.requiredDocumentId}`
      );

      if (!res.ok) {
        throw new Error('다운로드 URL을 가져오는데 실패했습니다.');
      }

      const { downloadUrl } = await res.json();

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || '양식';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Template download error:', err);
      onUploadError?.(err instanceof Error ? err.message : '양식 다운로드에 실패했습니다.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  }, [requiredDocument.requiredDocumentId, onUploadError]);

  /**
   * 양식 ZIP 파일 다운로드 (여러 파일)
   */
  const handleZipDownload = useCallback(async () => {
    setIsDownloadingTemplate(true);
    try {
      const res = await fetch(
        `/api/template/download-zip?requiredDocumentId=${requiredDocument.requiredDocumentId}`
      );

      if (!res.ok) {
        throw new Error('ZIP 다운로드 URL을 가져오는데 실패했습니다.');
      }

      const { downloadUrl, filename } = await res.json();

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || '양식.zip';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('ZIP download error:', err);
      onUploadError?.(err instanceof Error ? err.message : '양식 다운로드에 실패했습니다.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  }, [requiredDocument.requiredDocumentId, onUploadError]);

  /**
   * 업로드된 파일 삭제
   */
  const handleRemove = useCallback(async (documentId: string) => {
    setRemovingIds((prev) => new Set(prev).add(documentId));

    try {
      await deleteFile(documentId);
      const newUploads = uploads.filter((u) => u.submittedDocumentId !== documentId);
      updateUploads(newUploads);
    } catch (err) {
      onUploadError?.(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setRemovingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  }, [uploads, updateUploads, onUploadError]);

  // 업로드 작업 배열
  const taskArray = Array.from(uploadTasks.values());

  const content = (
    <>
      {/* Header */}
      <div className="items-start mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-foreground">{requiredDocument.documentTitle}</h3>
            {requiredDocument.isRequired && (
              <Badge variant="required">필수서류</Badge>
            )}
            {!requiredDocument.isRequired && (
              <Badge variant="optional">선택</Badge>
            )}
          </div>

          {/* 양식 다운로드 버튼 */}
          {requiredDocument.templates && requiredDocument.templates.length > 0 && (
            <button
              type="button"
              onClick={
                requiredDocument.templates.length >= 2 && requiredDocument.templateZipKey
                  ? handleZipDownload
                  : () => handleTemplateDownload(
                      requiredDocument.templates![0].s3Key,
                      requiredDocument.templates![0].filename
                    )
              }
              disabled={isDownloadingTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloadingTemplate ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>양식 다운로드</span>
            </button>
          )}
        </div>
        {requiredDocument.documentDescription && (
          <p className="text-base text-muted-foreground whitespace-pre-wrap">{requiredDocument.documentDescription}</p>
        )}
      </div>

      {/* Upload Area */}
      {isMultipleMode ? (
        // 복수 파일 모드
        <div className="space-y-2">
          {/* 업로드된 파일 목록 */}
          {uploads.map((upload) => (
            <FilePreview
              key={upload.submittedDocumentId}
              filename={upload.originalFilename}
              size={upload.size}
              onRemove={() => handleRemove(upload.submittedDocumentId)}
              isRemoving={removingIds.has(upload.submittedDocumentId)}
            />
          ))}

          {/* 업로드 진행 중인 작업들 */}
          {taskArray.map((task) => (
            <UploadProgressIndicator
              key={task.id}
              task={task}
              onRetry={() => handleTaskRetry(task.id)}
              onCancel={() => handleTaskCancel(task.id)}
            />
          ))}

          {/* 파일 추가 버튼 */}
          <FileUploadButton
            onClick={() => setIsModalOpen(true)}
            label={uploads.length > 0 ? '파일 추가하기' : '파일 업로드하기'}
          />
        </div>
      ) : (
        // 단일 파일 모드 (기존 UI)
        <>
          {taskArray.length > 0 ? (
            // 업로드 진행 중 또는 에러 상태
            <UploadProgressIndicator
              task={taskArray[0]}
              onRetry={() => handleTaskRetry(taskArray[0].id)}
              onCancel={() => handleTaskCancel(taskArray[0].id)}
            />
          ) : uploads.length > 0 ? (
            // 업로드 완료 상태
            <FilePreview
              filename={uploads[0].originalFilename}
              size={uploads[0].size}
              onRemove={() => handleRemove(uploads[0].submittedDocumentId)}
              isRemoving={removingIds.has(uploads[0].submittedDocumentId)}
            />
          ) : (
            // 초기 상태
            <FileUploadButton onClick={() => setIsModalOpen(true)} />
          )}
        </>
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

      <FileUploadDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        multiple={isMultipleMode}
        onFileSelect={!isMultipleMode ? handleFileSelect : undefined}
        onFilesSelect={isMultipleMode ? handleFilesSelect : undefined}
      />
    </>
  );
}
