import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';

interface PublicSubmitLandingViewProps {
  documentBox: {
    boxTitle: string;
    boxDescription: string | null;
    endDate: Date;
    requiredDocuments: {
      requiredDocumentId: string;
      documentTitle: string;
      documentDescription: string | null;
      isRequired: boolean;
    }[];
  };
  documentBoxId: string;
  logoUrl: string;
  isAuthenticated?: boolean;
}

export default function PublicSubmitLandingView({
  documentBox,
  documentBoxId,
  logoUrl,
  isAuthenticated = false,
}: PublicSubmitLandingViewProps) {
  const uploadUrl = `/submit/${documentBoxId}/upload`;
  const signInUrl = `/sign-in?callbackURL=${encodeURIComponent(uploadUrl)}`;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 영역 */}
        <div className="flex justify-center mb-6">
          <Image
            src={logoUrl}
            alt="로고"
            width={608}
            height={144}
            className="h-auto w-auto max-w-[150px] object-contain"
            priority
          />
        </div>

        {/* 메인 카드 */}
        <Card>
          <CardContent className="py-6">
            {/* 문서함 제목 */}
            <h1 className="text-2xl font-bold text-foreground text-center mb-4">
              {documentBox.boxTitle}
            </h1>

            {/* 문서함 설명 */}
            {documentBox.boxDescription && (
              <p className="text-muted-foreground text-center mb-6">
                {documentBox.boxDescription}
              </p>
            )}

            {/* 마감일 정보 */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
              <Calendar className="w-4 h-4" />
              <span>마감일: {formatDate(documentBox.endDate)}</span>
            </div>

            {/* 필수 서류 목록 */}
            {documentBox.requiredDocuments.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  제출 서류 목록
                </h3>
                <ul className="space-y-2">
                  {documentBox.requiredDocuments.map((doc) => (
                    <li
                      key={doc.requiredDocumentId}
                      className="flex items-start gap-2 text-sm"
                    >
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">
                        {doc.documentTitle}
                        {doc.isRequired && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 제출하기 버튼 */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              asChild
            >
              <Link href={isAuthenticated ? uploadUrl : signInUrl}>
                {isAuthenticated ? '문서 제출하기' : '로그인하고 제출하기'}
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
