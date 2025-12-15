import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import prisma from "@/lib/db";
import { stackServerApp } from "@/stack/server";
import { notFound, redirect } from "next/navigation";
import { History } from "lucide-react";

export default async function ReminderLogDetailPage({
    params,
}: {
    params: Promise<{ id: string; logId: string }>;
}) {
    const user = await stackServerApp.getUser();
    if (!user) redirect("/sign-in");

    const { id, logId } = await params;

    const log = await prisma.reminderLog.findUnique({
        where: { id: logId, documentBoxId: id },
        include: {
            recipients: {
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
                }
            }
        }
    });

    if (!log) notFound();

    // Recipient Name Summary
    const recipientCount = log.recipients.length;
    const title = recipientCount > 0
        ? recipientCount > 1
            ? `${log.recipients[0].submitter.name} 외 ${recipientCount - 1}명`
            : log.recipients[0].submitter.name
        : '수신자 없음';

    return (
        <div className="min-h-screen bg-white">
            <DashboardHeader />
            <main className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
                    <p className="text-sm text-gray-600">리마인드 상세 내용을 확인해보세요.</p>
                </div>

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
                                {log.recipients.map((recipient) => {
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
                    {/* Pagination Placeholder */}
                    <div className="flex justify-end mt-4 gap-2">
                        <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">이전</button>
                        <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">다음</button>
                    </div>
                </div>
            </main>
        </div>
    )
}
