import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
        {/* 문서함 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
          {documentBox.boxTitle}
        </h1>

        {/* 제출자 정보 카드 */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
          <p className="text-lg font-semibold text-gray-900 mb-1">
            {submitter.name} 님
          </p>
          <p className="text-gray-500">
            서류 제출을 진행해주세요!
          </p>
        </div>

        {/* 제출하기 버튼 */}
        <Link
          href={signInUrl}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          제출하기
          <ArrowRight className="w-5 h-5" />
        </Link>

        {/* 안내 문구 */}
        <p className="text-sm text-gray-400 text-center mt-6">
          제출한 문서는 안전하게 보관됩니다.
        </p>
      </div>
    </main>
  );
}
