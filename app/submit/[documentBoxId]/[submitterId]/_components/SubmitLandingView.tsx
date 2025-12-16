'use client';

import { useStackApp } from '@stackframe/stack';
import Image from 'next/image';
import Link from 'next/link';
import { FileText, Calendar, CheckCircle } from 'lucide-react';

interface RequiredDocument {
  requiredDocumentId: string;
  documentTitle: string;
  documentDescription: string | null;
}

interface SubmitLandingViewProps {
  submitter: {
    name: string;
    email: string;
  };
  documentBox: {
    boxTitle: string;
    boxDescription: string | null;
    endDate: Date;
    requiredDocuments: RequiredDocument[];
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
  const app = useStackApp();

  // 로그인 후 돌아올 URL
  const returnUrl = `/submit/${documentBoxId}/${submitterId}/upload`;

  const handleGoogleLogin = () => {
    // Stack Auth OAuth 로그인 (returnTo로 리다이렉트 제어)
    app.signInWithOAuth('google', {
      returnTo: returnUrl,
    });
  };

  // 이메일 마스킹 (예: te***@example.com)
  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    return `${local.slice(0, 2)}***@${domain}`;
  };

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-lg w-full p-8">
          {/* 인사말 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {submitter.name}님, 안녕하세요!
            </h1>
            <p className="text-gray-600">
              아래 서류 제출을 위해 로그인해 주세요.
            </p>
          </div>

          {/* 문서함 정보 */}
          <div className="bg-gray-50 rounded-lg p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">{documentBox.boxTitle}</h2>
            </div>

            {documentBox.boxDescription && (
              <p className="text-sm text-gray-600 mb-3">{documentBox.boxDescription}</p>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>
                마감일: {new Date(documentBox.endDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* 필수 서류 목록 */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-3">제출 서류</h3>
            <ul className="space-y-2">
              {documentBox.requiredDocuments.map((doc) => (
                <li key={doc.requiredDocumentId} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-700">{doc.documentTitle}</span>
                    {doc.documentDescription && (
                      <p className="text-gray-400 text-xs mt-0.5">{doc.documentDescription}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 로그인 버튼 */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
              <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.14 18.63 6.71 16.7 5.84 14.09H2.18V16.93C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
              <path d="M5.84 14.09C5.62 13.43 5.49 12.73 5.49 12C5.49 11.27 5.62 10.57 5.84 9.91V7.07H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.93L5.84 14.09Z" fill="#FBBC05" />
              <path d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.02L19.37 3.86C17.46 2.09 14.97 1 12 1C7.7 1 3.99 3.47 2.18 7.07L5.84 9.91C6.71 7.3 9.14 5.38 12 5.38Z" fill="#EA4335" />
            </svg>
            Google로 로그인하여 제출하기
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            {maskEmail(submitter.email)} 계정으로 로그인해 주세요.
          </p>
        </div>
      </main>
    </div>
  );
}
