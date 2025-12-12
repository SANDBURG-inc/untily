import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import DocumentRegistrationForm from "@/components/dashboard/DocumentRegistrationForm";

export default async function RegisterPage() {
    const user = await stackServerApp.getUser();

    if (!user) {
        redirect("/sign-in");
    }

    return (
        <div className="min-h-screen bg-white">
            <DashboardHeader />

            <main className="container mx-auto px-4 py-8">
                <DocumentRegistrationForm />
            </main>
        </div>
    );
}
