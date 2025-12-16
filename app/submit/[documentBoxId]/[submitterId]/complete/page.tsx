import { validateSubmitterAuth } from '@/lib/auth/submitter-auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { CheckCircle, FileText, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CompletePageProps {
  params: Promise<{ documentBoxId: string; submitterId: string }>;
}

export default async function CompletePage({ params }: CompletePageProps) {
  const { documentBoxId, submitterId } = await params;

  const result = await validateSubmitterAuth(documentBoxId, submitterId);

  // 인증 실패 케이스들 → 랜딩으로
  if (result.status !== 'success') {
    redirect(`/submit/${documentBoxId}/${submitterId}`);
  }

  // 아직 제출 안 한 경우 → 업로드로
  if (result.submitter.status !== 'SUBMITTED') {
    redirect(`/submit/${documentBoxId}/${submitterId}/upload`);
  }

  // 제출 서류 조회
  const submittedDocs = await prisma.submittedDocument.findMany({
    where: { submitterId },
    include: { requiredDocument: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <Link href="/">
          <Image
            src="/logo_light.svg"
            alt="오늘까지"
            width={120}
            height={32}
            className="h-8 w-auto"
          />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-lg w-full p-8 text-center">
          {/* 성공 아이콘 */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            제출이 완료되었습니다!
          </h1>

          <p className="text-gray-600 mb-8">
            {result.submitter.name}님의 서류가 성공적으로 제출되었습니다.
          </p>

          {/* 제출 내역 */}
          <div className="bg-gray-50 rounded-lg p-5 text-left mb-6">
            <h3 className="font-medium text-gray-900 mb-4">제출 내역</h3>

            {/* 문서함 정보 */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-500 mb-1">문서함</p>
              <p className="font-medium text-gray-900">{result.submitter.documentBox.boxTitle}</p>
            </div>

            {/* 제출 서류 목록 */}
            <ul className="space-y-2 mb-4">
              {submittedDocs.map((doc) => (
                <li key={doc.submittedDocumentId} className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{doc.requiredDocument.documentTitle}</span>
                </li>
              ))}
            </ul>

            {/* 제출 일시 */}
            {result.submitter.submittedAt && (
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>
                  제출일시:{' '}
                  {new Date(result.submitter.submittedAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400">
            이 페이지를 닫으셔도 됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
