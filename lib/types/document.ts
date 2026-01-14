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
