'use client';

/**
 * Presigned URL로 S3에 직접 파일 업로드 (클라이언트 전용)
 * XHR을 사용하여 progress 이벤트 지원
 */
export async function uploadToS3(params: {
  uploadUrl: string;
  file: File;
  onProgress?: (percent: number) => void;
}): Promise<void> {
  const { uploadUrl, file, onProgress } = params;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

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
  onProgress?: (percent: number) => void;
}

interface UploadResult {
  submittedDocumentId: string;
  s3Key: string;
  fileUrl: string;
  filename: string; // 표시용 파일명 (서류명_날짜_제출자이름.확장자)
}

/**
 * 전체 업로드 플로우 (API 호출 + S3 업로드)
 */
export async function uploadFile(params: UploadFileParams): Promise<UploadResult> {
  const { file, documentBoxId, submitterId, requiredDocumentId, onProgress } = params;

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
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to get upload URL');
  }

  const { uploadUrl, submittedDocumentId, s3Key, fileUrl, filename } = await res.json();

  // 2. S3에 직접 업로드
  await uploadToS3({ uploadUrl, file, onProgress });

  return { submittedDocumentId, s3Key, fileUrl, filename };
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
