import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FileText, History, Bell, Edit } from 'lucide-react';
import { notFound } from "next/navigation";
import { AutoReminderSettings } from "@/components/dashboard/AutoReminderSettings";
import { SubmittersList } from "@/components/dashboard/SubmittersList";
import { IconButton } from "@/components/shared/IconButton";
import { ensureAuthenticated } from "@/lib/auth";
import { getDocumentBoxWithSubmissionStatus } from "@/lib/queries/document-box";
import Link from "next/link";

export default async function DocumentBoxDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await ensureAuthenticated();
    const { id } = await params;

    const documentBox = await getDocumentBoxWithSubmissionStatus(id, user.id);

    if (!documentBox) {
        notFound();
    }

    const totalSubmitters = documentBox.submitters.length;
    const submittedCount = documentBox.submitters.filter(
        s => s.submittedCount >= documentBox.totalRequiredDocuments && documentBox.totalRequiredDocuments > 0
    ).length;
    const submissionRate = totalSubmitters > 0 ? Math.round((submittedCount / totalSubmitters) * 100) : 0;

    return (
        <div className="min-h-screen bg-white">
            <DashboardHeader />

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                {documentBox.boxTitle}
                            </h1>
                            <p className="text-sm text-gray-600">
                                {documentBox.boxDescription || '제출할 서류를 확인하세요.'}
                            </p>
                        </div>
                        <IconButton
                            as="link"
                            href={`/dashboard/${id}/edit`}
                            variant="primary"
                            size="md"
                            icon={<Edit size={16} />}
                        >
                            문서함 수정
                        </IconButton>
                    </div>
                </div>

                {/* Submission Info */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-gray-700" />
                        <h2 className="text-base font-semibold text-gray-900">제출 현황</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">생성일</div>
                            <div className="text-sm font-medium text-gray-900">
                                {documentBox.createdAt.toISOString().split('T')[0]}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 mb-1">마감일</div>
                            <div className="text-sm font-medium text-gray-900">
                                {documentBox.endDate.toISOString().split('T')[0]}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 mb-1">제출자</div>
                            <div className="text-sm font-medium text-gray-900">
                                {totalSubmitters}명
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 mb-1">제출률</div>
                            <div className="text-sm font-medium text-blue-600">
                                {submissionRate}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submitters List */}
                {totalSubmitters > 0 && (
                    <SubmittersList
                        submitters={documentBox.submitters}
                        documentBoxTitle={documentBox.boxTitle}
                        totalRequiredDocuments={documentBox.totalRequiredDocuments}
                    />
                )}

                {/* Required Documents */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-gray-700" />
                        <h2 className="text-base font-semibold text-gray-900">수집 서류 목록</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {documentBox.requiredDocuments.map((doc) => (
                            <div key={doc.requiredDocumentId} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900">{doc.documentTitle}</span>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${doc.isRequired ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {doc.isRequired ? '필수' : '옵션'}
                                    </span>
                                </div>
                                {doc.documentDescription && (
                                    <p className="text-xs text-gray-500">{doc.documentDescription}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reminder History */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <History className="w-5 h-5 text-gray-700" />
                            <h2 className="text-xl font-bold text-gray-900">리마인드 내역</h2>
                        </div>
                        <IconButton
                            as="link"
                            href={`/dashboard/${id}/send`}
                            variant="outline-primary"
                            size="md"
                            icon={<Bell className="w-4 h-4" />}
                        >
                            리마인드 발송
                        </IconButton>
                    </div>

                    <AutoReminderSettings
                        documentBoxId={id}
                        initialEnabled={documentBox.documentBoxRemindTypes.length > 0}
                    />

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">수신자</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">리마인드 발송일</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">리마인드 채널</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">발송</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documentBox.reminderLogs.length > 0 ? (
                                    documentBox.reminderLogs.map((log) => {
                                        const recipientCount = log.recipients.length;
                                        const recipientText = recipientCount > 0
                                            ? recipientCount > 1
                                                ? `${log.recipients[0].submitter.name} 외 ${recipientCount - 1}명`
                                                : log.recipients[0].submitter.name
                                            : '수신자 없음';

                                        return (
                                            <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4 text-sm text-gray-900 font-medium hover:text-blue-600">
                                                    <Link href={`/dashboard/${id}/reminders/${log.id}`}>
                                                        {recipientText}
                                                    </Link>
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
                                    })
                                ) : (
                                    <tr className="border-b border-gray-100">
                                        <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                                            발송된 리마인드 내역이 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
