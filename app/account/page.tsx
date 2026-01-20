import { ensureAuthenticated } from '@/lib/auth';
import { AccountPageContent } from '@/components/account/AccountPageContent';

export default async function AccountPage() {
  const user = await ensureAuthenticated();

  return <AccountPageContent user={user} />;
}
