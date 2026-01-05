export interface Submitter {
    id: string;
    name: string;
    email: string;
    phone: string;
}

export interface DocumentRequirement {
    id: string;
    name: string;
    type: string;
    description: string;
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
