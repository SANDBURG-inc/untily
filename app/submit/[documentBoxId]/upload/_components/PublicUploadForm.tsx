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
}

export default function PublicUploadForm({
  documentBox,
  submitter,
  documentBoxId,
}: PublicUploadFormProps) {
  return (
    <BaseUploadForm
      documentBox={documentBox}
      submitter={submitter}
      documentBoxId={documentBoxId}
      submitterId={submitter.submitterId}
      checkoutUrl={`/submit/${documentBoxId}/checkout`}
    />
  );
}
