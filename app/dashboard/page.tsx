import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DocumentCard } from "@/components/dashboard/DocumentCard";
import { Plus } from "lucide-react";
import Link from "next/link";

import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const user = await stackServerApp.getUser();

    if (!user) {
        redirect("/sign-in");
    }

    return (
        <div className="min-h-screen bg-white">
            <DashboardHeader />

            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
                    <h1 className="text-2xl font-bold text-slate-900">내 문서함</h1>
                    <Link href="/dashboard/register" className="hidden md:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Plus size={16} />
                        문서함 등록
                    </Link>
                </div>

                <p className="text-slate-500 mb-8">
                    서류 제출 현황을 한눈에 확인하고 관리하세요
                </p>

                {/* Mobile button */}
                <Link href="/dashboard/register" className="md:hidden w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-8">
                    <Plus size={16} />
                    문서함 등록
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DocumentCard
                        title="2024년 연말정산 서류 제출"
                        description="연말정산을 위한 필수 서류를 제출해주세요."
                        createdDate="2024-11-01"
                        dueDate="2024-12-31"
                        currentCount={15}
                        totalCount={20}
                        unsubmittedCount={2}
                        status="In Progress"
                    />
                    <DocumentCard
                        title="2024년 연말정산 서류 제출"
                        description="연말정산을 위한 필수 서류를 제출해주세요."
                        createdDate="2024-11-01"
                        dueDate="2024-12-31"
                        currentCount={15}
                        totalCount={20}
                        unsubmittedCount={2}
                        status="In Progress"
                    />
                </div>
            </main>
        </div>
    );
}
