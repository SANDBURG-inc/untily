import { AccountView } from '@neondatabase/neon-js/auth/react/ui';
import { accountViewPaths } from '@neondatabase/neon-js/auth/react/ui/server';
import { DeleteAccountSection } from './DeleteAccountSection';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

export default async function AccountPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;

  return (
    <main className="container mx-auto p-4 md:p-6">
      <AccountView path={path} />

      {/* settings 경로에서만 탈퇴 버튼 표시 */}
      {path === 'settings' && <DeleteAccountSection />}
    </main>
  );
}
