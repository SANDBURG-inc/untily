
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
  return (
    <UploadForm
      documentBox={{
        boxTitle: submitter.documentBox.boxTitle,
        requiredDocuments: submitter.documentBox.requiredDocuments,
      }}
      submitter={{
        name: submitter.name,
        submittedDocuments: submitter.submittedDocuments.map((doc) => ({
          submittedDocumentId: doc.submittedDocumentId,
          requiredDocumentId: doc.requiredDocumentId,
          filename: doc.filename,
          size: doc.size,
        })),
      }}
      documentBoxId={documentBoxId}
      submitterId={submitterId}
    />
  );
}
