import { validatePublicSubmitAuth } from '@/lib/auth/public-submit-auth';
import { handlePublicLandingRedirects } from '@/lib/auth/submit-redirect';
import PublicSubmitLandingView from './_components/PublicSubmitLandingView';

interface PublicSubmitLandingPageProps {
  params: Promise<{ documentBoxId: string }>;
}

export default async function PublicSubmitLandingPage({ params }: PublicSubmitLandingPageProps) {
  const { documentBoxId } = await params;

  const result = await validatePublicSubmitAuth(documentBoxId);

  // 문서함 없음, 공개 제출 아님, 만료됨 → 리다이렉트
  const validResult = handlePublicLandingRedirects(result, documentBoxId);

  // 인증 여부 확인
  const isAuthenticated = validResult.status === 'success';

  // 랜딩 페이지 표시 (인증 여부와 관계없이)
  return (
    <PublicSubmitLandingView
      documentBox={{
        boxTitle: validResult.documentBox.boxTitle,
        boxDescription: validResult.documentBox.boxDescription,
        endDate: validResult.documentBox.endDate,
        requiredDocuments: validResult.documentBox.requiredDocuments,
      }}
      documentBoxId={documentBoxId}
      logoUrl={validResult.documentBox.logoUrl}
      isAuthenticated={isAuthenticated}
    />
  );
}
