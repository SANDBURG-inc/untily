import SignInForm from "@/components/auth/SignInForm";
import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DEFAULT_REDIRECT } from "@/lib/auth/return-url";

interface SignInPageProps {
    searchParams: Promise<{ callbackURL?: string; email?: string; password?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
    const { user } = await getSession();
    const { callbackURL, email, password } = await searchParams;

    // 이미 로그인된 사용자는 리다이렉트
    if (user) {
        redirect(callbackURL || DEFAULT_REDIRECT);
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center">
            {/* Top Bar with Logo */}
            <header className="w-full flex justify-start px-20 py-6 border-b border-gray-100">
                <Link href="/" className="relative w-32 h-8">
                    <Image
                        src="/logo_light.svg"
                        alt="오늘까지"
                        fill
                        className="object-contain object-left"
                    />
                </Link>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <SignInForm callbackURL={callbackURL} defaultEmail={email} defaultPassword={password} />
            </main>
        </div>
    );
}