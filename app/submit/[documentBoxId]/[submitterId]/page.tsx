import { validateSubmitterAuth } from '@/lib/auth/submitter-auth';
import { redirect } from 'next/navigation';
import SubmitLandingView from './_components/SubmitLandingView';
import EmailMismatchView from './_components/EmailMismatchView';

interface SubmitLandingPageProps {
  params: Promise<{ documentBoxId: string; submitterId: string }>;
}

export default async function SubmitLandingPage({ params }: SubmitLandingPageProps) {
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

  // 이미 로그인 + 이메일 일치 → upload 페이지로
  if (result.status === 'success') {
    // 이미 제출 완료인 경우 complete로
    if (result.submitter.status === 'SUBMITTED') {
      redirect(`/submit/${documentBoxId}/${submitterId}/complete`);
    }
    redirect(`/submit/${documentBoxId}/${submitterId}/upload`);
  }

  // 이메일 불일치
  if (result.status === 'email_mismatch') {
    return (
      <EmailMismatchView
        userEmail={result.user.email || ''}
        submitterEmail={result.submitter.email}
        submitterName={result.submitter.name}
      />
    );
  }

  // 미인증 상태 → 랜딩 페이지 표시
  return (
    <SubmitLandingView
      submitter={{
        name: result.submitter.name,
        email: result.submitter.email,
      }}
      documentBox={{
        boxTitle: result.submitter.documentBox.boxTitle,
        boxDescription: result.submitter.documentBox.boxDescription,
        endDate: result.submitter.documentBox.endDate,
        requiredDocuments: result.submitter.documentBox.requiredDocuments,
      }}
      documentBoxId={documentBoxId}
      submitterId={submitterId}
      logoUrl={result.logoUrl}
    />
  );
}
