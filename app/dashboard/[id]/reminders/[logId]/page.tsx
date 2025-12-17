import { History } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PageHeader } from "@/components/shared/PageHeader";
import prisma from "@/lib/db";
import { stackServerApp } from "@/stack/server";

export default async function ReminderLogDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string; logId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const user = await stackServerApp.getUser();
    if (!user) redirect("/sign-in");

    const { id, logId } = await params;

    // Pagination Params
    const { page } = await searchParams;
    const currentPage = typeof page === 'string' ? Math.max(1, parseInt(page)) : 1;
    const pageSize = 10;

    // 1. Fetch Log Basic Info
    const log = await prisma.reminderLog.findUnique({
        where: { id: logId, documentBoxId: id },
    });

    if (!log) notFound();

    // 2. Fetch Total Recipient Count
    const totalCount = await prisma.reminderRecipient.count({
        where: { reminderLogId: logId },
    });
    const totalPages = Math.ceil(totalCount / pageSize);

    // 3. Fetch Paginated Recipients
    const recipients = await prisma.reminderRecipient.findMany({
        where: { reminderLogId: logId },
        include: {
            submitter: {
                include: {
                    submittedDocuments: {
                        where: {
                            requiredDocument: {
                                documentBoxId: id
                            }
                        }
                    }
                }
            }
        },
        orderBy: {
            submitter: {
                name: 'asc'
            }
        },
        take: pageSize,
        skip: (currentPage - 1) * pageSize,
    });

    // Recipient Name Summary (Representative Name must be consistent across pages)
    // Always fetch the first recipient based on the same sorting order
    const representativeRecipient = await prisma.reminderRecipient.findFirst({
        where: { reminderLogId: logId },
        include: { submitter: true },
        orderBy: {
            submitter: {
                name: 'asc'
            }
        },
    });

    const firstRecipientName = representativeRecipient?.submitter.name ?? "알 수 없음";

    const title = totalCount > 0
        ? totalCount > 1
            ? `${firstRecipientName} 외 ${totalCount - 1}명`
            : firstRecipientName
        : '수신자 없음';

    return (
        <div className="min-h-screen bg-white">
            <DashboardHeader />
            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <PageHeader
                    title={title}
                    description="리마인드 상세 내용을 확인해보세요."
                />

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <History className="w-5 h-5 text-gray-700" />
                        <h2 className="text-lg font-bold text-gray-900">리마인드 내역</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">수신자</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">제출상태</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">리마인드 발송일</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">리마인드 채널</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">발송</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipients.map((recipient) => {
                                    const isSubmitted = recipient.submitter.submittedDocuments.length > 0;
                                    return (
                                        <tr key={recipient.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-sm text-gray-900">{recipient.submitter.name}</td>
                                            <td className="py-3 px-4 text-sm">
                                                <span className={isSubmitted ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                                                    {isSubmitted ? "제출완료" : "미제출"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {log.sentAt.toISOString().split('T')[0]}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {log.channel === 'EMAIL' ? '이메일' : log.channel === 'SMS' ? '문자' : '앱 푸시'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {log.isAuto ? '자동발송' : '직접발송'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 px-2">
                        <span className="text-sm text-gray-500">
                            {currentPage} / {totalPages > 0 ? totalPages : 1}
                        </span>
                        <div className="flex gap-2">
                            {currentPage > 1 ? (
                                <Link
                                    href={`/dashboard/${id}/reminders/${logId}?page=${currentPage - 1}`}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 bg-white"
                                >
                                    이전
                                </Link>
                            ) : (
                                <button disabled className="px-3 py-1 text-sm border border-gray-300 rounded bg-gray-50 text-gray-300 cursor-not-allowed">
                                    이전
                                </button>
                            )}

                            {currentPage < totalPages ? (
                                <Link
                                    href={`/dashboard/${id}/reminders/${logId}?page=${currentPage + 1}`}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 bg-white"
                                >
                                    다음
                                </Link>
                            ) : (
                                <button disabled className="px-3 py-1 text-sm border border-gray-300 rounded bg-gray-50 text-gray-300 cursor-not-allowed">
                                    다음
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
