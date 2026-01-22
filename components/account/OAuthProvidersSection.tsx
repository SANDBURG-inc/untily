'use client';

import { useContext } from 'react';
import Image from 'next/image';
import { AuthUIContext } from '@neondatabase/neon-js/auth/react/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Link2 } from 'lucide-react';

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  credential: '이메일/비밀번호',
};

export function OAuthProvidersSection() {
  const { hooks, social } = useContext(AuthUIContext);
  const { data: accounts, isPending, refetch } = hooks.useListAccounts();

  if (isPending) {
    return (
      <Card variant="compact">
        <CardHeader variant="compact">
          <CardTitle>
            <SectionHeader icon={Link2} title="연동 계정" size="lg" />
          </CardTitle>
        </CardHeader>
        <CardContent variant="compact">
          <p className="text-sm text-gray-500">계정 정보를 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  // 연결된 프로바이더 목록
  const linkedProviders = accounts
    ?.filter((acc) => acc.providerId !== 'credential')
    .map((acc) => acc.providerId) ?? [];

  const hasCredentialAccount = accounts?.some((acc) => acc.providerId === 'credential');
  const hasOAuthAccount = linkedProviders.length > 0;

  return (
    <Card variant="compact">
      <CardHeader variant="compact">
        <CardTitle>
          <SectionHeader
            icon={Link2}
            title="로그인 방식"
            size="lg"
          />
        </CardTitle>
      </CardHeader>
      <CardContent variant="compact">
        <div className="flex flex-wrap gap-2">
          {hasCredentialAccount && (
            <span className="inline-flex items-center px-3 py-1 rounded-md bg-blue-100 text-blue-800 text-sm font-medium">
              이메일/비밀번호
            </span>
          )}
          {linkedProviders.map((provider) => (
            <span
              key={provider}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-green-100 text-green-800 text-sm font-medium"
            >
              {provider === 'google' ? (
                <Image
                  src="/logo/google_logo.svg"
                  alt="Google"
                  width={20}
                  height={20}
                />
              ) : (
                PROVIDER_LABELS[provider] || provider
              )}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
