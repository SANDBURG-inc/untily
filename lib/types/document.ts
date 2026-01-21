// 문서함 상태 타입 (클라이언트에서도 사용 가능하도록 직접 정의)
export type DocumentBoxStatus = 'OPEN' | 'CLOSED' | 'OPEN_SOMEONE' | 'CLOSED_EXPIRED' | 'OPEN_RESUME';

// 문서함 상태 레이블 매핑
export const DOCUMENT_BOX_STATUS_LABELS: Record<DocumentBoxStatus, string> = {
  OPEN: '제출 가능',
  CLOSED: '닫힘',
  OPEN_SOMEONE: '일부 제출 가능',
  CLOSED_EXPIRED: '마감됨',
  OPEN_RESUME: '다시 열림',
};

// 문서함 상태별 짧은 설명 (Badge용)
export const DOCUMENT_BOX_STATUS_SHORT_LABELS: Record<DocumentBoxStatus, string> = {
  OPEN: '열림',
  CLOSED: '닫힘',
  OPEN_SOMEONE: '일부열림',
  CLOSED_EXPIRED: '자동닫힘',
  OPEN_RESUME: '다시열림',
};

// 문서함 상태별 설명
export const DOCUMENT_BOX_STATUS_DESCRIPTIONS: Record<DocumentBoxStatus, string> = {
  OPEN: '서류를 제출할 수 있습니다.',
  CLOSED: '이 문서함은 더 이상 서류를 받지 않습니다.',
  OPEN_SOMEONE: '마감 후 리마인드를 받은 사용자만 제출할 수 있습니다.',
  CLOSED_EXPIRED: '마감일이 지나 더 이상 서류를 받지 않습니다.',
  OPEN_RESUME: '관리자가 다시 열었습니다. 누구나 제출할 수 있습니다.',
};

// 문서함이 제출 가능한 상태인지 확인 (일반 사용자 기준)
export function isDocumentBoxOpen(status: DocumentBoxStatus): boolean {
  return status === 'OPEN' || status === 'OPEN_RESUME';
}

// 제한적 제출 허용 상태인지 확인 (리마인드 수신자만 제출 가능)
export function isDocumentBoxLimitedOpen(status: DocumentBoxStatus): boolean {
  return status === 'OPEN_SOMEONE';
}

// 완전히 닫힌 상태인지 확인
export function isDocumentBoxClosed(status: DocumentBoxStatus): boolean {
  return status === 'CLOSED' || status === 'CLOSED_EXPIRED';
}

// 마감 관련 상태인지 확인 (만료 후 상태)
export function isExpiredStatus(status: DocumentBoxStatus): boolean {
  return status === 'OPEN_SOMEONE' || status === 'CLOSED_EXPIRED' || status === 'OPEN_RESUME';
}

// 관리자가 상태를 변경할 수 있는 옵션 목록
export const ADMIN_STATUS_CHANGE_OPTIONS: {
  from: DocumentBoxStatus[];
  to: DocumentBoxStatus;
  label: string;
  description: string;
}[] = [
  {
    from: ['CLOSED', 'CLOSED_EXPIRED'],
    to: 'OPEN_RESUME',
    label: '열림으로 변경',
    description: '마감일과 관계없이 제출을 허용합니다.',
  },
  {
    from: ['OPEN', 'OPEN_SOMEONE', 'OPEN_RESUME'],
    to: 'CLOSED',
    label: '닫힘으로 변경',
    description: '제출을 차단합니다.',
  },
];

/**
 * 현재 상태에서 변경 가능한 옵션 목록 반환
 * @param currentStatus 현재 문서함 상태
 * @returns 변경 가능한 옵션 배열
 */
export function getAvailableStatusChangeOptions(currentStatus: DocumentBoxStatus) {
  return ADMIN_STATUS_CHANGE_OPTIONS.filter(option =>
    option.from.includes(currentStatus)
  );
}

export interface Submitter {
    id: string;
    name: string;
    email: string;
    phone: string;
}

/** 양식 파일 정보 */
export interface TemplateFile {
    s3Key: string;
    filename: string;
}

export interface DocumentRequirement {
    id: string;
    name: string;
    type: string;
    description: string;
    // 양식 파일 목록 (여러 개 가능)
    templates?: TemplateFile[];
    // 양식 ZIP 파일 S3 키 (2개 이상일 때 미리 생성됨)
    templateZipKey?: string | null;
    // 복수 파일 업로드 허용 여부
    allowMultiple?: boolean;
    // 표시 순서
    order?: number;
}

export interface CreateDocumentBoxRequest {
    documentName: string;
    description: string;
    logoUrl?: string | null;
    submittersEnabled: boolean;
    submitters: (Omit<Submitter, 'id'> & { id?: string })[];
    requirements: (Omit<DocumentRequirement, 'id'> & { id?: string })[];
    deadline: string;
    reminderEnabled: boolean;
    emailReminder: boolean;
    smsReminder: boolean;
    kakaoReminder: boolean;
}

export interface CreateDocumentBoxResponse {
    success: boolean;
    documentBoxId?: string;
    error?: string;
}
