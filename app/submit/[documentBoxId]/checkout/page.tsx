import { validatePublicSubmitAuth } from '@/lib/auth/public-submit-auth';
import { redirect } from 'next/navigation';
import PublicCheckoutView from './_components/PublicCheckoutView';

interface PublicCheckoutPageProps {
  params: Promise<{ documentBoxId: string }>;
}

export default async function PublicCheckoutPage({ params }: PublicCheckoutPageProps) {
  const { documentBoxId } = await params;

  const result = await validatePublicSubmitAuth(documentBoxId);

  // 문서함 없음
  if (result.status === 'not_found') {
    redirect('/submit/not-found');
  }

  // 공개 제출 문서함이 아님
  if (result.status === 'not_public') {
    redirect('/submit/not-found');
  }

  // 만료됨
  if (result.status === 'expired') {
    redirect(`/submit/expired?title=${encodeURIComponent(result.documentBox.boxTitle)}`);
  }

  // 미인증 → 랜딩으로
  if (result.status === 'not_authenticated') {
    redirect(`/submit/${documentBoxId}`);
  }

  // 이미 제출 완료된 경우 → complete로
  if (result.submitter.status === 'SUBMITTED') {
    redirect(`/submit/${documentBoxId}/complete`);
  }

  // 업로드된 파일이 없으면 upload로 리다이렉트
  if (result.submitter.submittedDocuments.length === 0) {
    redirect(`/submit/${documentBoxId}/upload`);
  }

  // 인증 완료 → 체크아웃 뷰 표시
  return (
    <PublicCheckoutView
      documentBox={{
        boxTitle: result.submitter.documentBox.boxTitle,
        requiredDocuments: result.submitter.documentBox.requiredDocuments.map((doc) => ({
          requiredDocumentId: doc.requiredDocumentId,
          documentTitle: doc.documentTitle,
          isRequired: doc.isRequired,
        })),
      }}
      submitter={{
        name: result.submitter.name,
        email: result.submitter.email,
        submitterId: result.submitter.submitterId,
        submittedDocuments: result.submitter.submittedDocuments.map((doc) => ({
          submittedDocumentId: doc.submittedDocumentId,
          requiredDocumentId: doc.requiredDocumentId,
          filename: doc.filename,
        })),
      }}
      documentBoxId={documentBoxId}
    />
  );
}
