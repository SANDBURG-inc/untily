/**
 * 파일 업로드 관련 타입 정의
 *
 * 비동기 업로드 상태 관리 및 에러 처리를 위한 타입들
 */

// 업로드 상태
export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

/**
 * 업로드 작업 정보
 *
 * 현재는 단일 파일 업로드용으로 사용
 * TODO: 복수 파일 업로드 시 Map<string, UploadTask>로 관리
 */
export interface UploadTask {
  id: string; // 임시 ID (UUID)
  file: File;
  status: UploadStatus;
  progress: number; // 0-100
  error?: UploadError;
  // 취소용 AbortController 참조
  abortController?: AbortController;
  // presigned URL 요청 시 생성된 문서 ID (취소 시 삭제용)
  submittedDocumentId?: string;
}

// 업로드 에러 정보
export interface UploadError {
  code: UploadErrorCode;
  message: string;
}

// 에러 코드 타입
export type UploadErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'AUTH_ERROR'
  | 'SERVER_ERROR'
  | 'ABORTED'
  | 'UNKNOWN';

// 에러 코드별 기본 메시지 (API에서 한글 메시지가 없을 경우 사용)
export const UPLOAD_ERROR_MESSAGES: Record<UploadErrorCode, string> = {
  NETWORK_ERROR: '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.',
  TIMEOUT: '업로드 시간이 초과되었습니다. 다시 시도해주세요.',
  FILE_TOO_LARGE: '파일 크기가 10MB를 초과합니다.',
  INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다.',
  AUTH_ERROR: '로그인이 필요합니다. 페이지를 새로고침해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  ABORTED: '업로드가 취소되었습니다.',
  UNKNOWN: '업로드 중 오류가 발생했습니다. 다시 시도해주세요.',
};
