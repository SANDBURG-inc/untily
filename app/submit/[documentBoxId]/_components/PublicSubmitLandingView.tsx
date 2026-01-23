import { Calendar, FileText } from 'lucide-react';
import { SubmitLandingLayout } from '@/components/submit/SubmitLandingLayout';
import { formatDateKorean } from '@/lib/utils/date';

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

  return (
    <SubmitLandingLayout
      title={documentBox.boxTitle}
      logoUrl={logoUrl}
      buttonText={isAuthenticated ? '문서 제출하기' : '로그인하고 제출하기'}
      buttonHref={isAuthenticated ? uploadUrl : signInUrl}
      titleClassName="mb-4"
    >
      {/* 문서함 설명 */}
      {documentBox.boxDescription && (
        <p className="text-muted-foreground text-center mb-6 whitespace-pre-line">
          {documentBox.boxDescription}
        </p>
      )}

      {/* 마감일 정보 */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
        <Calendar className="w-4 h-4" />
        <span>마감일: {formatDateKorean(documentBox.endDate)}</span>
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
    </SubmitLandingLayout>
  );
}
