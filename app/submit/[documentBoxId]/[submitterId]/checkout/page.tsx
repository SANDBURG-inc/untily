import { validateSubmitterAuth } from '@/lib/auth/submitter-auth';
import { handleSubmitterAuthRedirects } from '@/lib/auth/submit-redirect';
import { redirect } from 'next/navigation';
import CheckoutView from './_components/CheckoutView';

interface CheckoutPageProps {
  params: Promise<{ documentBoxId: string; submitterId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { documentBoxId, submitterId } = await params;

  const result = await validateSubmitterAuth(documentBoxId, submitterId);

  // 문서함/제출자 없음, 만료됨, 미인증, 이메일 불일치 → 리다이렉트
  const { submitter } = handleSubmitterAuthRedirects(result, documentBoxId, submitterId);

  // 이미 제출 완료된 경우 → complete로
  if (submitter.status === 'SUBMITTED') {
    redirect(`/submit/${documentBoxId}/${submitterId}/complete`);
  }

  // 업로드된 파일이 없으면 upload로 리다이렉트
  if (submitter.submittedDocuments.length === 0) {
    redirect(`/submit/${documentBoxId}/${submitterId}/upload`);
  }

  // 인증 완료 → 체크아웃 뷰 표시
  return (
    <CheckoutView
      documentBox={{
        boxTitle: submitter.documentBox.boxTitle,
        requiredDocuments: submitter.documentBox.requiredDocuments.map((doc) => ({
          requiredDocumentId: doc.requiredDocumentId,
          documentTitle: doc.documentTitle,
          documentDescription: doc.documentDescription,
          isRequired: doc.isRequired,
        })),
      }}
      submitter={{
        name: submitter.name,
        email: submitter.email,
        phone: submitter.phone,
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
    />
  );
}
