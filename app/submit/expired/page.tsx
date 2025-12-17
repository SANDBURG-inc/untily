import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ExpiredPageProps {
  searchParams: Promise<{ title?: string }>;
}

export default async function ExpiredPage({ searchParams }: ExpiredPageProps) {
  const { title } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-3">
          제출 기한이 만료되었습니다
        </h1>

        <p className="text-gray-600 mb-6">
          {title ? (
            <>
              <span className="font-medium text-gray-900">{title}</span>의{' '}
            </>
          ) : (
            '해당 문서함의 '
          )}
          제출 기한이 지났습니다.
          <br />
          담당자에게 문의해 주세요.
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
