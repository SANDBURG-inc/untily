import { validatePublicSubmitAuth } from '@/lib/auth/public-submit-auth';
import { handlePublicAuthRedirects } from '@/lib/auth/submit-redirect';
import { redirect } from 'next/navigation';
import PublicUploadForm from './_components/PublicUploadForm';

interface PublicUploadPageProps {
  params: Promise<{ documentBoxId: string }>;
}

export default async function PublicUploadPage({ params }: PublicUploadPageProps) {
  const { documentBoxId } = await params;

  // 문서함 기본적인 정보 검증(문서함 없음, 공개 제출 아님, 만료됨, 미인증 등)
  const result = await validatePublicSubmitAuth(documentBoxId);
  const { submitter } = handlePublicAuthRedirects(result, documentBoxId);

  // 이미 제출 완료된 경우 → complete로
  if (submitter.status === 'SUBMITTED') {
    redirect(`/submit/${documentBoxId}/complete`);
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

  // 폼 필드 변환 (Prisma → FormFieldData)
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

  // 폼 필드 그룹 변환 (BaseUploadForm에서 사용)
  const formFieldGroups = formFields.length > 0
    ? [{
        id: 'default-group',
        groupTitle: '입력 항목',
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
    <PublicUploadForm
      documentBox={{
        boxTitle: submitter.documentBox.boxTitle,
        requiredDocuments,
      }}
      submitter={{
        name: submitter.name,
        submitterId: submitter.submitterId,
        submittedDocuments: submitter.submittedDocuments.map((doc) => ({
          submittedDocumentId: doc.submittedDocumentId,
          requiredDocumentId: doc.requiredDocumentId,
          filename: doc.filename,
          originalFilename: doc.originalFilename,
          size: doc.size,
        })),
      }}
      documentBoxId={documentBoxId}
      formFieldGroups={formFieldGroups}
      formFieldsAboveDocuments={submitter.documentBox.formFieldsAboveDocuments}
      initialFormResponses={initialFormResponses}
    />
  );
}
