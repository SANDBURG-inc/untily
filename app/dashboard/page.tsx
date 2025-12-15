import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DocumentCard } from "@/components/dashboard/DocumentCard";
import { Plus } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/db";
import { ensureAuthenticated } from "@/lib/auth";

export default async function DashboardPage() {
    const user = await ensureAuthenticated();

    // Fetch document boxes from database
    const documentBoxes = await prisma.documentBox.findMany({
        where: {
            userId: user.id,
        },
        include: {
            submitters: true,
            requiredDocuments: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

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

                {documentBoxes.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-slate-500 mb-4">등록된 문서함이 없습니다.</p>
                        <Link href="/dashboard/register" className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            <Plus size={16} />
                            처음 문서함 등록하기
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {documentBoxes.map((box) => (
                            <DocumentCard
                                key={box.documentBoxId}
                                documentBoxId={box.documentBoxId}
                                title={box.boxTitle}
                                description={box.boxDescription || ''}
                                createdDate={box.createdAt.toISOString().split('T')[0]}
                                dueDate={box.endDate.toISOString().split('T')[0]}
                                currentCount={0}
                                totalCount={box.submitters.length}
                                unsubmittedCount={box.submitters.length}
                                status={new Date() > box.endDate ? 'Completed' : 'In Progress'}
                                hasLimitedSubmitters={box.submitters.length > 0}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
