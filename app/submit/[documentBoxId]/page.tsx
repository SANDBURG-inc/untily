import { validatePublicSubmitAuth } from '@/lib/auth/public-submit-auth';
import { redirect } from 'next/navigation';
import PublicSubmitLandingView from './_components/PublicSubmitLandingView';

interface PublicSubmitLandingPageProps {
  params: Promise<{ documentBoxId: string }>;
}

export default async function PublicSubmitLandingPage({ params }: PublicSubmitLandingPageProps) {
  const { documentBoxId } = await params;

  const result = await validatePublicSubmitAuth(documentBoxId);

  // 문서함 없음
  if (result.status === 'not_found') {
    redirect('/submit/not-found');
  }

  // 공개 제출 문서함이 아님 (지정 제출자 필요)
  if (result.status === 'not_public') {
    redirect('/submit/not-found');
  }

  // 만료됨
  if (result.status === 'expired') {
    redirect(`/submit/expired?title=${encodeURIComponent(result.documentBox.boxTitle)}`);
  }

  // 이미 로그인됨 → upload 페이지로
  if (result.status === 'success') {
    // 이미 제출 완료인 경우 complete로
    if (result.submitter.status === 'SUBMITTED') {
      redirect(`/submit/${documentBoxId}/complete`);
    }
    redirect(`/submit/${documentBoxId}/upload`);
  }

  // 미인증 상태 → 랜딩 페이지 표시
  return (
    <PublicSubmitLandingView
      documentBox={{
        boxTitle: result.documentBox.boxTitle,
        boxDescription: result.documentBox.boxDescription,
        endDate: result.documentBox.endDate,
        requiredDocuments: result.documentBox.requiredDocuments,
      }}
      documentBoxId={documentBoxId}
      logoUrl={result.documentBox.logoUrl}
    />
  );
}
