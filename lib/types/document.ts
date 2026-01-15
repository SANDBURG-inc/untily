import { DocumentBoxStatus } from '@/lib/generated/prisma/client';

// Prisma enum re-export
export { DocumentBoxStatus };

// 문서함 상태 레이블 매핑
export const DOCUMENT_BOX_STATUS_LABELS: Record<DocumentBoxStatus, string> = {
  OPEN: '제출 가능',
  CLOSED: '제출 마감',
};

// 문서함 상태별 설명
export const DOCUMENT_BOX_STATUS_DESCRIPTIONS: Record<DocumentBoxStatus, string> = {
  OPEN: '서류를 제출할 수 있습니다.',
  CLOSED: '이 문서함은 더 이상 서류를 받지 않습니다.',
};

// 문서함이 열려있는지 확인하는 유틸리티
export function isDocumentBoxOpen(status: DocumentBoxStatus): boolean {
  return status === 'OPEN';
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
