import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function SubmitNotFoundPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-8 h-8 text-gray-500" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-3">
          페이지를 찾을 수 없습니다
        </h1>

        <p className="text-gray-600 mb-6">
          요청하신 문서함 또는 제출자 정보를 찾을 수 없습니다.
          <br />
          링크가 올바른지 확인해 주세요.
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
