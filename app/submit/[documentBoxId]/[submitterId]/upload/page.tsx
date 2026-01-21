
import { validateSubmitterAuth } from '@/lib/auth/submitter-auth';
import { handleSubmitterAuthRedirects } from '@/lib/auth/submit-redirect';
import { redirect } from 'next/navigation';
import UploadForm from './_components/UploadForm';

interface UploadPageProps {
  params: Promise<{ documentBoxId: string; submitterId: string }>;
}

export default async function UploadPage({ params }: UploadPageProps) {
  const { documentBoxId, submitterId } = await params;

  const result = await validateSubmitterAuth(documentBoxId, submitterId);

  // 문서함/제출자 없음, 만료됨, 미인증, 이메일 불일치 → 리다이렉트
  const { submitter } = handleSubmitterAuthRedirects(result, documentBoxId, submitterId);

  // 이미 제출 완료된 경우 → complete로
  if (submitter.status === 'SUBMITTED') {
    redirect(`/submit/${documentBoxId}/${submitterId}/complete`);
  }

  // 인증 완료 → 업로드 폼 표시
  // Prisma JsonValue → TemplateFile[] 타입 변환
  const requiredDocuments = submitter.documentBox.requiredDocuments.map((doc) => ({
    requiredDocumentId: doc.requiredDocumentId,
    documentTitle: doc.documentTitle,
    documentDescription: doc.documentDescription,
    isRequired: doc.isRequired,
    templates: (doc.templates as Array<{ s3Key: string; filename: string }>) || [],
    templateZipKey: doc.templateZipKey,
    allowMultipleFiles: doc.allowMultipleFiles,
  }));

  // 폼 필드 변환 (Prisma → FormFieldData) - 그룹 없이 직접 연결
  const formFields = submitter.documentBox.formFields.map((field) => ({
    id: field.formFieldId,
    fieldLabel: field.fieldLabel,
    fieldType: field.fieldType,
    placeholder: field.placeholder || undefined,
    description: field.description || undefined,
    isRequired: field.isRequired,
    order: field.order,
    options: (field.options as string[]) || [],
    hasOtherOption: field.hasOtherOption,
    validation: field.validation as { minLength?: number; maxLength?: number; pattern?: string; patternMessage?: string } | undefined,
  }));

  // 기존 호환성을 위한 formFieldGroups 변환 (UploadForm에서 사용)
  const formFieldGroups = formFields.length > 0
    ? [{
        id: 'default-group',
        groupTitle: '질문',
        groupDescription: undefined,
        isRequired: true,
        order: 0,
        fields: formFields,
      }]
    : [];

  // 기존 폼 응답 변환
  const initialFormResponses = submitter.formFieldResponses.map((response) => ({
    formFieldId: response.formFieldId,
    value: response.value,
  }));

  return (
    <UploadForm
      documentBox={{
        boxTitle: submitter.documentBox.boxTitle,
        requiredDocuments,
      }}
      submitter={{
        name: submitter.name,
        submittedDocuments: submitter.submittedDocuments.map((doc) => ({
          submittedDocumentId: doc.submittedDocumentId,
          requiredDocumentId: doc.requiredDocumentId,
          filename: doc.filename,
          originalFilename: doc.originalFilename,
          size: doc.size,
        })),
      }}
      documentBoxId={documentBoxId}
      submitterId={submitterId}
      formFieldGroups={formFieldGroups}
      formFieldsAboveDocuments={submitter.documentBox.formFieldsAboveDocuments}
      initialFormResponses={initialFormResponses}
    />
  );
}
