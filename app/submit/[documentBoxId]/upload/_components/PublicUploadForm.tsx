'use client';

import BaseUploadForm from '@/components/submit/upload/BaseUploadForm';
import type { FormFieldGroupData, FormFieldResponseData } from '@/lib/types/form-field';

/** 양식 파일 정보 */
interface TemplateFile {
  s3Key: string;
  filename: string;
}

interface RequiredDocument {
  requiredDocumentId: string;
  documentTitle: string;
  documentDescription: string | null;
  isRequired: boolean;
  // 양식 파일 목록 (여러 개 가능)
  templates?: TemplateFile[];
}

interface SubmittedDocument {
  submittedDocumentId: string;
  requiredDocumentId: string;
  filename: string;
  originalFilename: string;
  size?: number;
}

interface PublicUploadFormProps {
  documentBox: {
    boxTitle: string;
    requiredDocuments: RequiredDocument[];
  };
  submitter: {
    name: string;
    submitterId: string;
    submittedDocuments: SubmittedDocument[];
  };
  documentBoxId: string;
  /** 폼 필드 그룹 목록 */
  formFieldGroups?: FormFieldGroupData[];
  /** 폼 필드 표시 위치 (true: 서류 위, false: 서류 아래) */
  formFieldsAboveDocuments?: boolean;
  /** 기존 폼 응답 */
  initialFormResponses?: FormFieldResponseData[];
}

export default function PublicUploadForm({
  documentBox,
  submitter,
  documentBoxId,
  formFieldGroups,
  formFieldsAboveDocuments,
  initialFormResponses,
}: PublicUploadFormProps) {
  return (
    <BaseUploadForm
      documentBox={documentBox}
      submitter={submitter}
      documentBoxId={documentBoxId}
      submitterId={submitter.submitterId}
      checkoutUrl={`/submit/${documentBoxId}/checkout`}
      formFieldGroups={formFieldGroups}
      formFieldsAboveDocuments={formFieldsAboveDocuments}
      initialFormResponses={initialFormResponses}
    />
  );
}
