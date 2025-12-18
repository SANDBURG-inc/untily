/**
 * 파일명 sanitize (한글 지원, 특수문자 제거)
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFC')
    .replace(/[^a-zA-Z0-9가-힣._-]/g, '_')
    .slice(0, 100);
}

/**
 * 파일 확장자에 따른 Content-Type 반환
 */
export function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const contentTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  return contentTypes[ext || ''] || 'application/octet-stream';
}

/**
 * 제출 파일용 S3 키 생성
 */
export function generateS3Key(params: {
  documentBoxId: string;
  submitterId: string;
  requiredDocumentId: string;
  filename: string;
}): string {
  const { documentBoxId, submitterId, requiredDocumentId, filename } = params;
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(filename);
  return `uploads/${documentBoxId}/${submitterId}/${requiredDocumentId}/${timestamp}_${sanitized}`;
}

/**
 * S3 키에서 파일 URL 생성
 */
export function getFileUrl(key: string, bucket: string, region: string): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * 로고 파일용 S3 키 생성
 * - 기본 로고: logo/{userId}/{timestamp}_{filename}
 * - 문서함 로고: logo/{userId}/{documentBoxId}/{timestamp}_{filename}
 */
export function generateLogoS3Key(params: {
  userId: string;
  documentBoxId?: string;
  filename: string;
}): string {
  const { userId, documentBoxId, filename } = params;
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(filename);

  if (documentBoxId) {
    return `logo/${userId}/${documentBoxId}/${timestamp}_${sanitized}`;
  }
  return `logo/${userId}/${timestamp}_${sanitized}`;
}
