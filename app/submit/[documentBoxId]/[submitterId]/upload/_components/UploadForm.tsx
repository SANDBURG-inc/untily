'use client';

import BaseUploadForm from '@/components/submit/upload/BaseUploadForm';

interface RequiredDocument {
  requiredDocumentId: string;
  documentTitle: string;
  documentDescription: string | null;
  isRequired: boolean;
}

interface SubmittedDocument {
  submittedDocumentId: string;
  requiredDocumentId: string;
  filename: string;
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
