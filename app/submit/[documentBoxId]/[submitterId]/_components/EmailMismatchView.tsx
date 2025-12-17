'use client';

import { authClient } from '@/lib/auth/client';
import { AlertTriangle } from 'lucide-react';

interface EmailMismatchViewProps {
  userEmail: string;
  submitterEmail: string;
  submitterName: string;
}

export default function EmailMismatchView({
  userEmail,
  submitterEmail,
  submitterName,
}: EmailMismatchViewProps) {
  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  // 이메일 마스킹 (예: te***@example.com)
  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    return `${local.slice(0, 2)}***@${domain}`;
  };

  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-md w-full p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-3">
            이메일이 일치하지 않습니다
          </h1>

          <p className="text-gray-600 mb-6">
            <strong className="text-gray-900">{submitterName}</strong>님의 서류 제출을 위해서는
            <br />
            <span className="text-blue-600 font-medium">{maskEmail(submitterEmail)}</span>
            <br />
            계정으로 로그인해야 합니다.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 w-full mb-6">
            <p className="text-sm text-gray-500 mb-1">현재 로그인된 계정</p>
            <p className="text-sm font-medium text-gray-900">{userEmail}</p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            다른 계정으로 로그인
          </button>

          <p className="mt-4 text-xs text-gray-400">
            본인의 이메일이 맞는데 접근이 안 되면 담당자에게 문의하세요.
          </p>
        </div>
      </div>
    </main>
  );
}
