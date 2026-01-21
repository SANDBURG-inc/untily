import DocumentRegistrationForm from "@/components/dashboard/DocumentRegistrationForm";
import { ensureAuthenticated } from "@/lib/auth";
import { getUserDefaultLogo } from "@/lib/queries/logo";

export default async function RegisterPage() {
    const user = await ensureAuthenticated();

    // 사용자 기본 로고 조회 (문서함 로고 없을 때 미리보기에서 사용)
    const userDefaultLogoUrl = await getUserDefaultLogo(user.id);

    return (
        <main className="container mx-auto max-w-6xl px-4 py-8">
            <DocumentRegistrationForm userDefaultLogoUrl={userDefaultLogoUrl} />
        </main>
    );
}
