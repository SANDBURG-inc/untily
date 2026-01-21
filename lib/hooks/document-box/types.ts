/**
 * DocumentBox 폼 관련 Custom Hook 타입 정의
 */

import type { Submitter, DocumentRequirement, TemplateFile, DocumentBoxStatus } from '@/lib/types/document';
import type { FormFieldGroupData } from '@/lib/types/form-field';

// ===== 초기 데이터 =====

/**
 * 문서함 초기 데이터 (수정 모드에서 사용)
 */
export interface DocumentBoxInitialData {
  documentName: string;
  description: string;
  logoUrl?: string;
  submittersEnabled: boolean;
  submitters: Submitter[];
  requirements: DocumentRequirement[];
  /** 폼 필드 그룹 목록 */
  formFieldGroups: FormFieldGroupData[];
  /** 폼 필드 표시 위치 (true: 수집 서류 위, false: 아래) */
  formFieldsAboveDocuments: boolean;
  deadline: string;
  reminderEnabled: boolean;
  emailReminder: boolean;
  smsReminder: boolean;
  kakaoReminder: boolean;
  /** 문서함 상태 (수정 모드에서만 사용) */
  status?: DocumentBoxStatus;
}

// ===== useBasicInfo =====

export interface UseBasicInfoOptions {
  initialData?: Pick<DocumentBoxInitialData, 'documentName' | 'description' | 'logoUrl'>;
}

export interface UseBasicInfoReturn {
  // 상태
  documentName: string;
  description: string;
  logoUrl: string;
  logoFile: File | null;
  logoPreviewUrl: string | null;
  logoDialogOpen: boolean;
  // 액션
  setDocumentName: (value: string) => void;
  setDescription: (value: string) => void;
  setLogoUrl: (url: string) => void;
  setLogoDialogOpen: (open: boolean) => void;
  handleLogoRemove: () => void;
  handleLogoSelect: (file: File, previewUrl: string) => void;
}

// ===== useTemplateFiles =====

export interface UseTemplateFilesReturn {
  // 상태
  templateFiles: Map<string, File[]>;
  uploadingTemplateIds: string[];
  // 액션
  handleTemplateFileSelect: (requirementId: string, file: File) => void;
  handleTemplateFileRemove: (requirementId: string, index: number) => void;
  uploadTemplateFiles: (
    requirements: DocumentRequirement[],
    documentBoxId?: string
  ) => Promise<Map<string, TemplateFile[]>>;
  clearTemplateFiles: () => void;
}

// ===== useSubmitters =====

export interface UseSubmittersOptions {
  initialData?: Pick<DocumentBoxInitialData, 'submittersEnabled' | 'submitters'>;
}

export interface UseSubmittersReturn {
  // 상태
  submittersEnabled: boolean;
  submitters: Submitter[];
  // 액션
  setSubmittersEnabled: (enabled: boolean) => void;
  setSubmitters: (submitters: Submitter[]) => void;
  handleSubmittersEnabledChange: (enabled: boolean, onDisable?: () => void) => void;
}

// ===== useRequirements =====

export interface UseRequirementsOptions {
  initialData?: Pick<DocumentBoxInitialData, 'requirements'>;
}

export interface UseRequirementsReturn {
  // 상태
  requirements: DocumentRequirement[];
  // 액션
  setRequirements: (requirements: DocumentRequirement[]) => void;
  addTemplateToRequirement: (requirementId: string, template: TemplateFile) => void;
  removeTemplateFromRequirement: (requirementId: string, index: number) => void;
}

// ===== useFormFieldGroups =====

export interface UseFormFieldGroupsOptions {
  initialData?: Pick<DocumentBoxInitialData, 'formFieldGroups' | 'formFieldsAboveDocuments'>;
}

export interface UseFormFieldGroupsReturn {
  // 상태 - 새로운 questions 배열 (UI에서 사용)
  questions: import('@/lib/types/form-field').FormFieldData[];
  setQuestions: (questions: import('@/lib/types/form-field').FormFieldData[]) => void;
  // 상태 - 기존 formFieldGroups 형식 (API 호환성)
  formFieldGroups: FormFieldGroupData[];
  formFieldsAboveDocuments: boolean;
  // 액션
  setFormFieldGroups: (groups: FormFieldGroupData[]) => void;
  setFormFieldsAboveDocuments: (above: boolean) => void;
}

// ===== useSubmissionSettings =====

export interface UseSubmissionSettingsOptions {
  initialData?: Pick<
    DocumentBoxInitialData,
    'deadline' | 'reminderEnabled' | 'emailReminder' | 'smsReminder' | 'kakaoReminder'
  >;
}

export interface UseSubmissionSettingsReturn {
  // 상태
  deadline: Date | undefined;
  reminderEnabled: boolean;
  emailReminder: boolean;
  smsReminder: boolean;
  kakaoReminder: boolean;
  // 액션
  setDeadline: (date: Date | undefined) => void;
  setReminderEnabled: (enabled: boolean) => void;
  setEmailReminder: (enabled: boolean) => void;
}

// ===== useFormSubmission =====

export interface SubmitFormParams {
  mode: 'create' | 'edit';
  documentBoxId?: string;
  // 폼 데이터
  documentName: string;
  description: string;
  logoUrl: string;
  logoFile: File | null;
  submittersEnabled: boolean;
  submitters: Submitter[];
  requirements: DocumentRequirement[];
  formFieldGroups: FormFieldGroupData[];
  formFieldsAboveDocuments: boolean;
  deadline: Date | undefined;
  reminderEnabled: boolean;
  emailReminder: boolean;
  smsReminder: boolean;
  kakaoReminder: boolean;
  /** 상태를 OPEN으로 변경할지 여부 (기한 연장으로 다시 열기 확인 시) */
  changeStatusToOpen?: boolean;
  // 파일 업로드 함수 (의존성 주입)
  uploadLogoFile: (file: File) => Promise<string>;
  uploadTemplateFiles: (
    requirements: DocumentRequirement[],
    boxId?: string
  ) => Promise<Map<string, TemplateFile[]>>;
  // 성공 콜백
  onSuccess: (documentBoxId?: string) => void;
}

export interface ConfirmDialogData {
  submitters: string[];
  requirements: string[];
}

export interface UseFormSubmissionReturn {
  // 상태
  isSubmitting: boolean;
  error: string | null;
  confirmDialogOpen: boolean;
  confirmDialogData: ConfirmDialogData | null;
  // 액션
  setError: (error: string | null) => void;
  setConfirmDialogOpen: (open: boolean) => void;
  submitForm: (params: SubmitFormParams, force?: boolean) => Promise<void>;
  handleForceSubmit: () => void;
}

// ===== useDocumentBoxForm (메인 훅) =====

export interface UseDocumentBoxFormOptions {
  mode: 'create' | 'edit';
  documentBoxId?: string;
  initialData?: DocumentBoxInitialData;
}

export interface UseDocumentBoxFormReturn
  extends Omit<UseBasicInfoReturn, 'handleLogoRemove' | 'handleLogoSelect'>,
    Omit<UseTemplateFilesReturn, 'handleTemplateFileSelect' | 'handleTemplateFileRemove' | 'uploadTemplateFiles' | 'clearTemplateFiles'>,
    Omit<UseSubmittersReturn, 'handleSubmittersEnabledChange'>,
    Omit<UseRequirementsReturn, 'addTemplateToRequirement' | 'removeTemplateFromRequirement'>,
    Omit<UseFormFieldGroupsReturn, never>,
    UseSubmissionSettingsReturn,
    Omit<UseFormSubmissionReturn, 'submitForm'> {
  // 오버라이드된 핸들러
  handleLogoRemove: () => void;
  handleLogoSelect: (file: File, previewUrl: string) => void;
  handleTemplateFileSelect: (requirementId: string, file: File) => void;
  handleTemplateFileRemove: (requirementId: string, index: number) => void;
  handleSubmittersEnabledChange: (enabled: boolean) => void;
  // 폼 핸들러
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleForceDelete: () => Promise<void>;
  handleCancel: () => void;
  // 다시 열기 관련 (기한 연장으로 닫힌 문서함을 다시 열 때)
  documentBoxStatus?: DocumentBoxStatus;
  initialDeadline?: Date;
  reopenConfirmed: boolean;
  setReopenConfirmed: (confirmed: boolean) => void;
  // 유틸리티
  isEditMode: boolean;
  effectiveLogoUrl: string;
}

// Re-export 기존 타입
export type { Submitter, DocumentRequirement, TemplateFile };
