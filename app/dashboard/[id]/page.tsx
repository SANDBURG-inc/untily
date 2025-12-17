import { Edit, Send } from 'lucide-react';
import { notFound } from 'next/navigation';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { IconButton } from '@/components/shared/IconButton';
import { PageHeader } from '@/components/shared/PageHeader';
import {
    SubmissionStats,
    SubmittersList,
    RequiredDocumentsList,
    ReminderHistory,
} from '@/components/dashboard/detail';
import { ensureAuthenticated } from '@/lib/auth';
import { getDocumentBoxWithSubmissionStatus } from '@/lib/queries/document-box';

/**
 * 문서함 상세 페이지
 * - 제출 현황: 생성일, 마감일, 제출자 수, 제출률
 * - 제출자 목록: 체크박스 선택, CSV 다운로드
 * - 수집 서류 목록: 필수/선택 서류 카드
 * - 리마인드 내역: 자동 리마인드 설정 + 발송 기록
 */
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

    // 제출률 계산: 전체 필수 서류를 모두 제출한 제출자 비율
    const totalSubmitters = documentBox.submitters.length;
    const submittedCount = documentBox.submitters.filter(
        s => s.submittedCount >= documentBox.totalRequiredDocuments && documentBox.totalRequiredDocuments > 0
    ).length;
    const submissionRate = totalSubmitters > 0
        ? Math.round((submittedCount / totalSubmitters) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-white">
            <DashboardHeader />

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                {/* 페이지 헤더: 문서함 제목 + 수정 버튼 */}
                <PageHeader
                    title={documentBox.boxTitle}
                    description={documentBox.boxDescription || '제출할 서류를 확인하세요.'}
                    actions={
                        <>
                            <IconButton
                                as="link"
                                href={`/dashboard/${id}/edit`}
                                variant="secondary"
                                size="sm"
                                icon={<Edit size={16} />}
                            >
                                문서함 수정
                            </IconButton>
                            <IconButton
                                variant="primary"
                                icon={<Send size={16} />}
                            >
                                서류 제출 요청
                            </IconButton>
                        </>
                    }
                />

                {/* 1. 제출 현황 */}
                <SubmissionStats
                    createdAt={documentBox.createdAt}
                    endDate={documentBox.endDate}
                    totalSubmitters={totalSubmitters}
                    submissionRate={submissionRate}
                />

                {/* 2. 제출자 목록 */}
                {totalSubmitters > 0 && (
                    <SubmittersList
                        submitters={documentBox.submitters}
                        documentBoxTitle={documentBox.boxTitle}
                        totalRequiredDocuments={documentBox.totalRequiredDocuments}
                    />
                )}

                {/* 3. 수집 서류 목록 */}
                <RequiredDocumentsList documents={documentBox.requiredDocuments} />

                {/* 4. 리마인드 내역 */}
                <ReminderHistory
                    documentBoxId={id}
                    autoReminderEnabled={documentBox.documentBoxRemindTypes.length > 0}
                    reminderLogs={documentBox.reminderLogs}
                />
            </main>
        </div>
    );
}
