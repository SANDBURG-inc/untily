import { SubmitLandingLayout } from '@/components/submit/SubmitLandingLayout';

interface SubmitLandingViewProps {
  submitter: {
    name: string;
    email: string;
  };
  documentBox: {
    boxTitle: string;
    boxDescription: string | null;
    endDate: Date;
    requiredDocuments: {
      requiredDocumentId: string;
      documentTitle: string;
      documentDescription: string | null;
    }[];
  };
  documentBoxId: string;
  submitterId: string;
  logoUrl: string;
  isAuthenticated?: boolean;
}

export default function SubmitLandingView({
  submitter,
  documentBox,
  documentBoxId,
  submitterId,
  logoUrl,
  isAuthenticated = false,
}: SubmitLandingViewProps) {
  const uploadUrl = `/submit/${documentBoxId}/${submitterId}/upload`;
  const signInUrl = `/sign-in?callbackURL=${encodeURIComponent(uploadUrl)}`;

  return (
    <SubmitLandingLayout
      title={documentBox.boxTitle}
      logoUrl={logoUrl}
      buttonText={isAuthenticated ? '문서 제출하기' : '로그인하고 제출하기'}
      buttonHref={isAuthenticated ? uploadUrl : signInUrl}
    >
      {/* 제출자 정보 섹션 */}
      <div className="bg-[#EFF6FF] rounded-lg py-5 px-4 text-center mb-6">
        <p className="text-lg font-semibold text-foreground mb-1">
          {submitter.name} 님
        </p>
        <p className="text-muted-foreground">서류 제출을 진행해주세요!</p>
      </div>
    </SubmitLandingLayout>
  );
}
