import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white">
            <DashboardHeader />
            {children}
        </div>
    );
}
