import DocumentRegistrationForm from "@/components/dashboard/DocumentRegistrationForm";
import { ensureAuthenticated } from "@/lib/auth";

export default async function RegisterPage() {
    await ensureAuthenticated();

    return (
        <main className="container mx-auto max-w-6xl px-4 py-8">
            <DocumentRegistrationForm />
        </main>
    );
}
