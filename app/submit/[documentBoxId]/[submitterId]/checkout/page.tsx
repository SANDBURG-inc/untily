import { validateSubmitterAuth } from '@/lib/auth/submitter-auth';
import { redirect } from 'next/navigation';
import CheckoutView from './_components/CheckoutView';

interface CheckoutPageProps {
  params: Promise<{ documentBoxId: string; submitterId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { documentBoxId, submitterId } = await params;

  const result = await validateSubmitterAuth(documentBoxId, submitterId);

  // 문서함/제출자 없음
  if (result.status === 'not_found') {
    redirect('/submit/not-found');
  }

  // 만료됨
  if (result.status === 'expired') {
    redirect(`/submit/expired?title=${encodeURIComponent(result.documentBox.boxTitle)}`);
  }

  // 미인증 → 랜딩으로
  if (result.status === 'not_authenticated') {
    redirect(`/submit/${documentBoxId}/${submitterId}`);
  }

  // 이메일 불일치 → 랜딩으로
  if (result.status === 'email_mismatch') {
    redirect(`/submit/${documentBoxId}/${submitterId}`);
  }

  // 이미 제출 완료된 경우 → complete로
  if (result.submitter.status === 'SUBMITTED') {
    redirect(`/submit/${documentBoxId}/${submitterId}/complete`);
  }

  // 업로드된 파일이 없으면 upload로 리다이렉트
  if (result.submitter.submittedDocuments.length === 0) {
    redirect(`/submit/${documentBoxId}/${submitterId}/upload`);
  }

  // 인증 완료 → 체크아웃 뷰 표시
  return (
    <CheckoutView
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
        phone: result.submitter.phone,
        submittedDocuments: result.submitter.submittedDocuments.map((doc) => ({
          submittedDocumentId: doc.submittedDocumentId,
          requiredDocumentId: doc.requiredDocumentId,
          filename: doc.filename,
        })),
      }}
      documentBoxId={documentBoxId}
      submitterId={submitterId}
    />
  );
}
