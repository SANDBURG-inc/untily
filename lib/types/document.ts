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
    submitters: Omit<Submitter, 'id'>[];
    requirements: Omit<DocumentRequirement, 'id'>[];
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
