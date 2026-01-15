'use client';

import { useContext, useState } from 'react';
import Image from 'next/image';
import { AuthUIContext } from '@neondatabase/neon-js/auth/react/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  credential: '이메일/비밀번호',
};

export function SecuritySection() {
  const { hooks } = useContext(AuthUIContext);
  const { data: accounts, isPending } = hooks.useListAccounts();

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // OAuth 전용 계정인지 확인
  const hasCredentialAccount = accounts?.some((acc) => acc.providerId === 'credential');
  const hasOAuthOnly = accounts?.some((acc) => acc.providerId !== 'credential') && !hasCredentialAccount;

  // 연결된 OAuth 프로바이더 목록
  const linkedProviders = accounts
    ?.filter((acc) => acc.providerId !== 'credential')
    .map((acc) => acc.providerId) ?? [];

  const handlePasswordChange = async () => {
    setError('');

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setIsSaving(true);
    try {
      // TODO: 비밀번호 변경 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (err) {
      setError('비밀번호 변경 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isPending) {
    return (
      <Card variant="compact">
        <CardHeader variant="compact">
          <CardTitle>
            <SectionHeader icon={Shield} title="보안 설정" size="lg" />
          </CardTitle>
        </CardHeader>
        <CardContent variant="compact">
          <p className="text-sm text-gray-500">보안 정보를 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="compact">
      <CardHeader variant="compact">
        <CardTitle>
          <SectionHeader
            icon={Shield}
            title="보안 설정"
            size="lg"
          />
        </CardTitle>
      </CardHeader>
      <CardContent variant="compact" className="space-y-4">
        {/* 로그인 방식 */}
        <div className="space-y-2 pb-4 border-b">
          <h4 className="text-sm font-medium text-gray-700">로그인 방식</h4>
          <div className="flex flex-wrap gap-2">
            {hasCredentialAccount && (
              <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700">
                이메일/비밀번호
              </span>
            )}
            {linkedProviders.map((provider) => (
              <span key={provider} className="inline-flex items-center">
                {provider === 'google' ? (
                  <Image
                    src="/logo/google_logo.svg"
                    alt="Google"
                    width={84}
                    height={84}
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-700">
                    {PROVIDER_LABELS[provider] || provider}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* 비밀번호 변경 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">비밀번호</h4>
            {!isChangingPassword && hasCredentialAccount && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangingPassword(true)}
              >
                비밀번호 변경
              </Button>
            )}
          </div>

          {hasOAuthOnly && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-xs text-yellow-800">
                OAuth 로그인을 사용 중입니다. 비밀번호 설정 기능은 이메일/비밀번호 계정이 연결된 경우에만 사용할 수 있습니다.
              </p>
            </div>
          )}

          {isChangingPassword && hasCredentialAccount && (
            <div className="space-y-3 p-4 border rounded-md bg-gray-50">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-xs text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">현재 비밀번호</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 비밀번호를 입력하세요"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">새 비밀번호</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 (최소 8자)"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">새 비밀번호 확인</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호를 다시 입력하세요"
                  disabled={isSaving}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handlePasswordChange}
                  disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                  size="sm"
                >
                  {isSaving ? '변경 중...' : '비밀번호 변경'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                  disabled={isSaving}
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 2단계 인증 (추후 구현) */}
        {/* <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700">2단계 인증 (2FA)</h4>
              <p className="text-xs text-gray-500 mt-1">
                추가 보안 계층으로 계정을 보호합니다.
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              설정 (준비 중)
            </Button>
          </div>
        </div> */}
      </CardContent>
    </Card>
  );
}
