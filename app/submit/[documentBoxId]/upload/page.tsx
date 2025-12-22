import { validatePublicSubmitAuth } from '@/lib/auth/public-submit-auth';
import { handlePublicAuthRedirects } from '@/lib/auth/submit-redirect';
import { redirect } from 'next/navigation';
import PublicUploadForm from './_components/PublicUploadForm';

interface PublicUploadPageProps {
  params: Promise<{ documentBoxId: string }>;
}

export default async function PublicUploadPage({ params }: PublicUploadPageProps) {
  const { documentBoxId } = await params;

  const result = await validatePublicSubmitAuth(documentBoxId);

  // 문서함 없음, 공개 제출 아님, 만료됨, 미인증 → 리다이렉트
  const { submitter } = handlePublicAuthRedirects(result, documentBoxId);

  // 이미 제출 완료된 경우 → complete로
  if (submitter.status === 'SUBMITTED') {
    redirect(`/submit/${documentBoxId}/complete`);
  }

  // 인증 완료 → 업로드 폼 표시
  return (
    <PublicUploadForm
      documentBox={{
        boxTitle: submitter.documentBox.boxTitle,
        requiredDocuments: submitter.documentBox.requiredDocuments,
      }}
      submitter={{
        name: submitter.name,
        submitterId: submitter.submitterId,
        submittedDocuments: submitter.submittedDocuments.map((doc) => ({
          submittedDocumentId: doc.submittedDocumentId,
          requiredDocumentId: doc.requiredDocumentId,
          filename: doc.filename,
          size: doc.size,
        })),
      }}
      documentBoxId={documentBoxId}
    />
  );
}
