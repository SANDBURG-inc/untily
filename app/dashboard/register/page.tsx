import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import DocumentRegistrationForm from "@/components/dashboard/DocumentRegistrationForm";
import { ensureAuthenticated } from "@/lib/auth";

export default async function RegisterPage() {
    await ensureAuthenticated();

    return (
        <div className="min-h-screen bg-white">
            <DashboardHeader />

            <main className="container mx-auto px-4 py-8">
                <DocumentRegistrationForm />
            </main>
        </div>
    );
}
