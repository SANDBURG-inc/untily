'use client';

import {
  type UploadError,
  UPLOAD_ERROR_MESSAGES,
} from '@/lib/types/upload';

/**
 * 에러를 분석하여 적절한 에러 코드와 메시지 반환
 * API에서 반환하는 한글 메시지가 있으면 그대로 사용
 */
export function classifyUploadError(error: unknown): UploadError {
  // AbortError 처리 (사용자 취소)
  if (error instanceof Error && error.name === 'AbortError') {
    return { code: 'ABORTED', message: UPLOAD_ERROR_MESSAGES.ABORTED };
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // 네트워크 에러
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('failed to fetch')
    ) {
      return { code: 'NETWORK_ERROR', message: UPLOAD_ERROR_MESSAGES.NETWORK_ERROR };
    }

    // 타임아웃
    if (message.includes('timeout')) {
      return { code: 'TIMEOUT', message: UPLOAD_ERROR_MESSAGES.TIMEOUT };
    }

    // API에서 반환하는 한글 메시지 패턴 매칭
    const koreanMessage = error.message;

    if (koreanMessage.includes('로그인') || koreanMessage.includes('인증')) {
      return { code: 'AUTH_ERROR', message: koreanMessage };
    }

    if (koreanMessage.includes('10MB') || koreanMessage.includes('크기')) {
      return { code: 'FILE_TOO_LARGE', message: koreanMessage };
    }

    if (koreanMessage.includes('파일 형식') || koreanMessage.includes('확장자')) {
      return { code: 'INVALID_FILE_TYPE', message: koreanMessage };
    }

    // API에서 반환된 한글 메시지가 있으면 그대로 사용
    if (/[\uAC00-\uD7AF]/.test(koreanMessage)) {
      return { code: 'SERVER_ERROR', message: koreanMessage };
    }

    // 기본 서버 에러
    return { code: 'SERVER_ERROR', message: UPLOAD_ERROR_MESSAGES.SERVER_ERROR };
  }

  return { code: 'UNKNOWN', message: UPLOAD_ERROR_MESSAGES.UNKNOWN };
}

/**
 * Presigned URL로 S3에 직접 파일 업로드 (클라이언트 전용)
 * XHR을 사용하여 progress 이벤트 지원
 */
export async function uploadToS3(params: {
  uploadUrl: string;
  file: File;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { uploadUrl, file, onProgress, signal } = params;

  return new Promise((resolve, reject) => {
    // 이미 취소된 경우
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const xhr = new XMLHttpRequest();

    // AbortSignal 연동
    const onAbort = () => {
      xhr.abort();
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      signal?.removeEventListener('abort', onAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      signal?.removeEventListener('abort', onAbort);
      reject(new Error('네트워크 오류가 발생했습니다.'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

interface UploadFileParams {
  file: File;
  documentBoxId: string;
  submitterId: string;
  requiredDocumentId: string;
  /** 원본 파일명에서 추출한 한글 힌트 (클라이언트에서 중복 처리 포함) */
  originalNameHint?: string;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

interface UploadResult {
  submittedDocumentId: string;
  s3Key: string;
  fileUrl: string;
  filename: string; // 관리자용 가공 파일명 (서류명_날짜_제출자이름.확장자)
  originalFilename: string; // 원본 파일명 (UI 표시용)
}

/**
 * 전체 업로드 플로우 (API 호출 + S3 업로드)
 *
 * signal이 전달되면 취소 가능
 * 취소 시 이미 생성된 DB 레코드는 호출자가 deleteFile로 정리해야 함
 */
export async function uploadFile(params: UploadFileParams): Promise<UploadResult> {
  const { file, documentBoxId, submitterId, requiredDocumentId, originalNameHint, onProgress, signal } = params;

  // 이미 취소된 경우
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // 1. Presigned URL 요청
  const res = await fetch('/api/upload/presigned', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentBoxId,
      submitterId,
      requiredDocumentId,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
      originalNameHint,
    }),
    signal,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to get upload URL');
  }

  const { uploadUrl, submittedDocumentId, s3Key, fileUrl, filename, originalFilename } = await res.json();

  // 2. S3에 직접 업로드
  await uploadToS3({ uploadUrl, file, onProgress, signal });

  return { submittedDocumentId, s3Key, fileUrl, filename, originalFilename };
}

/**
 * 파일 삭제
 */
export async function deleteFile(submittedDocumentId: string): Promise<void> {
  const res = await fetch(`/api/upload/${submittedDocumentId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '파일 삭제에 실패했습니다.');
  }
}

/**
 * 파일 교체 (기존 파일 삭제 후 새 파일 업로드)
 */
export async function replaceFile(params: UploadFileParams & {
  existingDocumentId: string;
}): Promise<UploadResult> {
  const { existingDocumentId, ...uploadParams } = params;

  // 기존 파일 삭제 요청
  await deleteFile(existingDocumentId);

  // 새 파일 업로드
  return uploadFile(uploadParams);
}
