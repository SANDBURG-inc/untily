import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';

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
}

export default function SubmitLandingView({
  submitter,
  documentBox,
  documentBoxId,
  submitterId,
}: SubmitLandingViewProps) {
  const uploadUrl = `/submit/${documentBoxId}/${submitterId}/upload`;
  const signInUrl = `/sign-in?callbackURL=${encodeURIComponent(uploadUrl)}`;

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* TODO: 로고 영역 (documentBox.logo가 있을 경우 표시) */}

        {/* 메인 카드 */}
        <Card>
          <CardContent className="py-6">
            {/* 문서함 제목 */}
            <h1 className="text-2xl font-bold text-foreground text-center mb-6">
              {documentBox.boxTitle}
            </h1>

            {/* 제출자 정보 섹션 */}
            <div className="bg-[#EFF6FF] rounded-lg py-5 px-4 text-center mb-6">
              <p className="text-lg font-semibold text-foreground mb-1">
                {submitter.name} 님
              </p>
              <p className="text-muted-foreground">
                서류 제출을 진행해주세요!
              </p>
            </div>

            {/* 제출하기 버튼 */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              asChild
            >
              <Link href={signInUrl}>
                제출하기
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>

            {/* 안내 문구 */}
            <p className="text-sm text-muted-foreground text-center mt-6">
              제출한 문서는 안전하게 보관됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
