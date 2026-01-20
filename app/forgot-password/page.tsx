import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import Image from "next/image";

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center">
            {/* Top Bar with Logo */}
            <header className="w-full flex justify-start px-20 py-6 border-b border-gray-100">
                <div className="relative w-32 h-8">
                    <Image
                        src="/logo_light.svg"
                        alt="오늘까지"
                        fill
                        className="object-contain object-left"
                    />
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <ForgotPasswordForm />
            </main>
        </div>
    );
}
