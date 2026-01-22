'use client';

import { FileText, Loader2, AlertCircle, X, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { UploadTask } from '@/lib/types/upload';

/**
 * 파일 크기를 읽기 좋은 형식으로 변환
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadProgressIndicatorProps {
  task: UploadTask;
  onRetry: () => void;
  onCancel: () => void;
}

/**
 * 업로드 진행 상태 표시 컴포넌트
 *
 * FilePreview와 동일한 스타일로 일관성 유지
 * - uploading: 회색 로딩 스피너 + X 버튼
 * - error: 빨간색 ! 아이콘 + 에러 메시지 + 재시도 버튼 + X 버튼
 *
 * TODO: 복수 파일 업로드 시 부모에서 여러 개 렌더링
 */
export default function UploadProgressIndicator({
  task,
  onRetry,
  onCancel,
}: UploadProgressIndicatorProps) {
  const isError = task.status === 'error';

  return (
    <div
      className={`
        flex items-center gap-3 border rounded-md p-3
        ${isError ? 'border-red-300 bg-red-50' : 'border-border'}
      `}
    >
      {/* 아이콘 영역 */}
      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
        {isError ? (
          <AlertCircle className="w-5 h-5 text-red-500" />
        ) : (
          <FileText className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {/* 파일 정보 영역 */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-md font-medium truncate ${
            isError ? 'text-red-700' : 'text-foreground'
          }`}
        >
          {task.file.name}
        </p>
        {isError && task.error ? (
          <p className="text-xs text-red-600">{task.error.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {formatFileSize(task.file.size)}
          </p>
        )}
      </div>

      {/* 액션 버튼 영역 */}
      <div className="flex items-center gap-1">
        {/* 업로드 중: 로딩 스피너 */}
        {task.status === 'uploading' && (
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        )}

        {/* 에러 시: 재시도 버튼 */}
        {isError && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRetry}
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
            title="다시 시도"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        )}

        {/* 취소/삭제 버튼 (FilePreview X 버튼과 동일 스타일) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title={isError ? '삭제' : '취소'}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
