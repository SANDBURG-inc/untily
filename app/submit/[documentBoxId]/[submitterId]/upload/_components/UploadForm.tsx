'use client';

import BaseUploadForm from '@/components/submit/upload/BaseUploadForm';

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

interface UploadFormProps {
  documentBox: {
    boxTitle: string;
    requiredDocuments: RequiredDocument[];
  };
  submitter: {
    name: string;
    submittedDocuments: SubmittedDocument[];
  };
  documentBoxId: string;
  submitterId: string;
}

export default function UploadForm({
  documentBox,
  submitter,
  documentBoxId,
  submitterId,
}: UploadFormProps) {
  return (
    <BaseUploadForm
      documentBox={documentBox}
      submitter={submitter}
      documentBoxId={documentBoxId}
      submitterId={submitterId}
      checkoutUrl={`/submit/${documentBoxId}/${submitterId}/checkout`}
    />
  );
}
