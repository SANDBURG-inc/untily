import { ensureAuthenticated } from '@/lib/auth';
import { AccountPageContent } from '@/components/account/AccountPageContent';
import prisma from '@/lib/db';

export default async function AccountPage() {
  const user = await ensureAuthenticated();

  // Prisma User 프로필 데이터 조회
  const userProfile = await prisma.user.findUnique({
    where: { authUserId: user.id },
    select: { name: true, phone: true },
  });

  return (
    <AccountPageContent
      user={user}
      userProfile={userProfile}
    />
  );
}
