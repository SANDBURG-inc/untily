import { validateSubmitterAuth } from '@/lib/auth/submitter-auth';
import { handleSubmitterLandingRedirects } from '@/lib/auth/submit-redirect';
import SubmitLandingView from './_components/SubmitLandingView';
import EmailMismatchView from './_components/EmailMismatchView';

interface SubmitLandingPageProps {
  params: Promise<{ documentBoxId: string; submitterId: string }>;
}

export default async function SubmitLandingPage({ params }: SubmitLandingPageProps) {
  const { documentBoxId, submitterId } = await params;

  const result = await validateSubmitterAuth(documentBoxId, submitterId);

  // 문서함/제출자 없음, 만료됨 → 리다이렉트
  const validResult = handleSubmitterLandingRedirects(result, documentBoxId, submitterId);

  // 이메일 불일치
  if (validResult.status === 'email_mismatch') {
    return (
      <EmailMismatchView
        userEmail={validResult.user.email || ''}
        submitterEmail={validResult.submitter.email}
        submitterName={validResult.submitter.name}
      />
    );
  }

  // 인증 여부 확인
  const isAuthenticated = validResult.status === 'success';

  // 랜딩 페이지 표시 (인증 여부와 관계없이)
  return (
    <SubmitLandingView
      submitter={{
        name: validResult.submitter.name,
        email: validResult.submitter.email,
      }}
      documentBox={{
        boxTitle: validResult.submitter.documentBox.boxTitle,
        boxDescription: validResult.submitter.documentBox.boxDescription,
        endDate: validResult.submitter.documentBox.endDate,
        requiredDocuments: validResult.submitter.documentBox.requiredDocuments,
      }}
      documentBoxId={documentBoxId}
      submitterId={submitterId}
      logoUrl={validResult.logoUrl}
      isAuthenticated={isAuthenticated}
    />
  );
}
