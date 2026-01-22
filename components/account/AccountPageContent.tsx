'use client';

import { AuthenticatedUser } from '@/lib/auth';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProfileSection } from './ProfileSection';
import { SecuritySection } from './SecuritySection';
import { SessionsSection } from './SessionsSection';
import { DeleteAccountSection } from '../../app/account/[path]/DeleteAccountSection';

interface UserProfile {
  name: string | null;
  phone: string | null;
}

interface AccountPageContentProps {
  user: AuthenticatedUser;
  userProfile: UserProfile | null;
}

export function AccountPageContent({ user, userProfile }: AccountPageContentProps) {
  return (
    <main className="container mx-auto p-4 md:p-6 max-w-4xl">
      <PageHeader title="계정 설정" description="계정 정보 및 보안 설정을 관리합니다." />

      <div className="space-y-6">
        {/* 프로필 정보 */}
        <ProfileSection user={user} userProfile={userProfile} />

        {/* 보안 설정 */}
        <SecuritySection />

        {/* 활성 세션 */}
        <SessionsSection />

        {/* 회원 탈퇴 */}
        <DeleteAccountSection />
      </div>
    </main>
  );
}
 