import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FileText, Calendar, Users, TrendingUp, Edit } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { ensureAuthenticated } from "@/lib/auth";

//TODO 수정 진행중
export default async function DocumentBoxDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await ensureAuthenticated();

    // Await params in Next.js 15
    const { id } = await params;

    // Fetch document box with all related data
    const documentBox = await prisma.documentBox.findUnique({
        where: {
            documentBoxId: id,
        },
        include: {
            submitters: true,
            requiredDocuments: true,
            documentBoxRemindTypes: true,
        },
    });

    // Check if document box exists and user owns it
    if (!documentBox || documentBox.userId !== user.id) {
        notFound();
    }

    const totalSubmitters = documentBox.submitters.length;
    const submittedCount = 0; // TODO: Calculate from submitted documents
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
                        <Link
                            href={`/dashboard/${id}/edit`}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            <Edit size={16} />
                            문서함 수정
                        </Link>
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
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-700" />
                                <h2 className="text-base font-semibold text-gray-900">제출자 목록</h2>
                            </div>
                            <button className="text-sm text-blue-600 hover:text-blue-700">
                                모두보기
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                                            <input type="checkbox" className="rounded" />
                                        </th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">이름</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">이메일</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">제출상태</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">제출일</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">진행상황</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documentBox.submitters.map((submitter) => (
                                        <tr key={submitter.submitterId} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <input type="checkbox" className="rounded" />
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-900">{submitter.name}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{submitter.email}</td>
                                            <td className="py-3 px-4">
                                                <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                                                    제출완료
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">2024-11-15</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">0/0 (0%)</td>
                                            <td className="py-3 px-4 text-sm text-gray-400">...</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
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
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                                        필수
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
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-gray-700" />
                            <h2 className="text-base font-semibold text-gray-900">리마인드 내역</h2>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-700">
                            리마인드 발송
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm text-gray-700">
                            마감 3일 전부터 매일 미제출자에게 자동으로 안내를 발송합니다.
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                                        <input type="checkbox" className="rounded" />
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">제목</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">발송 예정일</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">리마인드 방식</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">리마인드 상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 px-4">
                                        <input type="checkbox" className="rounded" />
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-900">주민등록 제출</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">2024-11-15</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">2024-11-15</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">대기중</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
