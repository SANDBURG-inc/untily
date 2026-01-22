'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { formatPhoneNumberOnInput, isValidPhoneNumber } from '@/lib/utils/phone';

interface UserProfile {
  name: string | null;
  phone: string | null;
}

interface ProfileSectionProps {
  user: AuthenticatedUser;
  userProfile: UserProfile | null;
}

export function ProfileSection({ user, userProfile }: ProfileSectionProps) {
  const router = useRouter();

  // Prisma User 데이터 우선, 없으면 Neon Auth 데이터 fallback
  const displayName = userProfile?.name || user.name;
  const displayPhone = userProfile?.phone || user.phone || '';

  const [name, setName] = useState(displayName);
  const [phone, setPhone] = useState(displayPhone);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumberOnInput(e.target.value);
    setPhone(formatted);
  };

  const handleSave = async () => {
    if (name === displayName && phone === displayPhone) {
      setIsEditing(false);
      return;
    }

    setError('');

    // 전화번호 유효성 검사
    if (phone && !isValidPhoneNumber(phone)) {
      setError('올바른 전화번호 형식이 아닙니다.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '업데이트에 실패했습니다.');
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError(error instanceof Error ? error.message : '프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(displayName);
    setPhone(displayPhone);
    setIsEditing(false);
    setError('');
  };

  return (
    <Card variant="compact">
      <CardHeader variant="compact">
        <div className="flex items-center justify-between">
          <CardTitle>
            <SectionHeader icon={User} title="프로필 정보" size="lg" />
          </CardTitle>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              수정
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent variant="compact" className="space-y-4">
        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs text-blue-800">
            💡 이름, 이메일, 연락처는 문서 제출 시 자동으로 입력됩니다.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-xs text-red-800">{error}</p>
          </div>
        )}

        {/* 이름 */}
        <div className="space-y-1">
          <label className="block text-xs text-gray-500">이름</label>
          {isEditing ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
            />
          ) : (
            <p className="text-base font-medium text-gray-900">{displayName}</p>
          )}
        </div>

        {/* 이메일 (조회만) */}
        <div className="space-y-1">
          <label className="block text-xs text-gray-500">이메일</label>
          <div className="flex items-center justify-between">
            <p className="text-base font-medium text-gray-900">{user.email}</p>
            <span className="text-xs text-gray-400">수정 불가</span>
          </div>
        </div>

        {/* 연락처 */}
        <div className="space-y-1">
          <label className="block text-xs text-gray-500">연락처</label>
          {isEditing ? (
            <Input
              value={phone}
              onChange={handlePhoneChange}
              placeholder="전화번호를 입력하세요"
            />
          ) : (
            <p className="text-base font-medium text-gray-900">{displayPhone || '미등록'}</p>
          )}
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              {isSaving ? '저장 중...' : '저장'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              disabled={isSaving}
            >
              취소
            </Button>
          </div>
        )}

        {/* 이메일 인증 상태 */}
        <div className="space-y-2 pt-4 border-t">
          <label className="text-sm font-medium text-gray-700">이메일 인증 상태</label>
          <div className="flex items-center gap-2">
            {user.emailVerified ? (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                인증 완료
              </span>
            ) : (
              <>
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 text-xs font-medium">
                  미인증
                </span>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                  인증 메일 재발송
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
