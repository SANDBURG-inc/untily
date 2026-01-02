import { validatePublicSubmitAuth } from '@/lib/auth/public-submit-auth';
import { handlePublicLandingRedirects } from '@/lib/auth/submit-redirect';
import PublicSubmitLandingView from './_components/PublicSubmitLandingView';

interface PublicSubmitLandingPageProps {
  params: Promise<{ documentBoxId: string }>;
}

export default async function PublicSubmitLandingPage({ params }: PublicSubmitLandingPageProps) {
  const { documentBoxId } = await params;

  const result = await validatePublicSubmitAuth(documentBoxId);

  // 문서함 없음, 공개 제출 아님, 만료됨, 인증 성공 → 리다이렉트
  const validResult = handlePublicLandingRedirects(result, documentBoxId);

  // 미인증 상태 → 랜딩 페이지 표시
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
    />
  );
}
