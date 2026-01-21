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
 * 파일명에서 확장자 추출
 */
export function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * 현재 날짜를 YYYYMMDD 형식으로 반환
 */
export function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 제출 파일명 생성 파라미터
 */
export interface SubmittedFilenameParams {
  requiredDocumentTitle: string;
  submitterName: string;
  originalFilename: string;
  /** 복수 파일 업로드 시 순번 (1부터 시작) */
  index?: number;
}

/**
 * 제출 파일명 생성
 * 형식: {서류명}_{날짜}_{제출자이름}.{확장자} (단일 파일)
 * 형식: {서류명}_{날짜}_{제출자이름}_{순번}.{확장자} (복수 파일)
 * 예시: 주민등록등본_20251219_홍길동.pdf
 * 예시: 주민등록등본_20251219_홍길동_2.pdf (두 번째 파일)
 */
export function generateSubmittedFilename(params: SubmittedFilenameParams): string {
  const { requiredDocumentTitle, submitterName, originalFilename, index } = params;

  const ext = getExtension(originalFilename);
  const date = getDateString();

  // 서류명과 제출자 이름 정규화 (특수문자 제거)
  const sanitizedTitle = requiredDocumentTitle
    .normalize('NFC')
    .replace(/[^a-zA-Z0-9가-힣]/g, '');
  const sanitizedName = submitterName
    .normalize('NFC')
    .replace(/[^a-zA-Z0-9가-힣]/g, '');

  // 복수 파일인 경우 순번 추가 (2번째부터)
  const indexSuffix = index && index > 1 ? `_${index}` : '';

  return `${sanitizedTitle}_${date}_${sanitizedName}${indexSuffix}.${ext}`;
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
 * S3 키는 식별용으로 timestamp + 원본파일명 사용
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
