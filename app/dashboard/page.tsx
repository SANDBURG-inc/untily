import { Plus } from "lucide-react";
import Link from "next/link";

import { DashboardHeaderActions } from "@/components/dashboard/DashboardHeaderActions";
import { DocumentCard } from "@/components/dashboard/DocumentCard";
import { IconButton } from "@/components/shared/IconButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { ensureAuthenticated } from "@/lib/auth";
import prisma from "@/lib/db";
import { hasDesignatedSubmitters } from "@/lib/utils/document-box";

export default async function DashboardPage() {
    const user = await ensureAuthenticated();

    // Fetch default logo
    const defaultLogo = await prisma.logo.findFirst({
        where: {
            userId: user.id,
            type: 'DEFAULT',
            documentBoxId: null,
        },
    });

    // Fetch document boxes from database
    const documentBoxes = await prisma.documentBox.findMany({
        where: {
            userId: user.id,
        },
        include: {
            submitters: true,
            requiredDocuments: { orderBy: { order: 'asc' } },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return (
        <main className="container mx-auto px-4 py-8">
            <PageHeader
                title="내 문서함"
                description="서류 제출 현황을 한눈에 확인하고 관리하세요"
                actions={
                    <div className="hidden md:block">
                        <DashboardHeaderActions existingLogoUrl={defaultLogo?.imageUrl} />
                    </div>
                }
            />

            {/* Mobile button */}
            <IconButton
                as="link"
                href="/dashboard/register"
                variant="primary"
                icon={<Plus size={16} />}
                className="md:hidden w-full justify-center mb-8"
            >
                문서함 등록
            </IconButton>

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
                    {documentBoxes.map((box) => {
                        const hasLimitedSubmitters = hasDesignatedSubmitters(box.hasSubmitter);
                        const currentCount = box.submitters.filter(s => s.status === 'SUBMITTED').length;
                        const totalCount = box.submitters.length;
                        const unsubmittedCount = totalCount - currentCount;
                        return (
                            <DocumentCard
                                key={box.documentBoxId}
                                documentBoxId={box.documentBoxId}
                                title={box.boxTitle}
                                description={box.boxDescription || ''}
                                createdDate={box.createdAt.toISOString().split('T')[0]}
                                dueDate={box.endDate.toISOString().split('T')[0]}
                                currentCount={currentCount}
                                totalCount={totalCount}
                                unsubmittedCount={unsubmittedCount}
                                hasLimitedSubmitters={hasLimitedSubmitters}
                                documentBoxStatus={box.status}
                            />
                        );
                    })}
                </div>
            )}
        </main>
    );
}
