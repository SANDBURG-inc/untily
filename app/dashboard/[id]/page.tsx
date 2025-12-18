import { Edit, Send } from 'lucide-react';
import { notFound } from 'next/navigation';

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
import { calculateSubmissionStats } from '@/lib/utils/document-box';

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

    // 제출 통계 계산 (유틸리티 함수 사용)
    const stats = calculateSubmissionStats(
        documentBox.submitters,
        documentBox.totalRequiredDocuments,
        documentBox.hasSubmitter
    );

    return (
        <main className="container mx-auto px-4 py-8">
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
                            as="link"
                            href={stats.hasDesignatedSubmitters ? `/dashboard/${id}/send` : `/dashboard/${id}/share`}
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
                totalSubmitters={stats.totalSubmitters}
                submittedCount={stats.submittedCount}
                notSubmittedCount={stats.notSubmittedCount}
                submissionRate={stats.submissionRate}
                hasDesignatedSubmitters={stats.hasDesignatedSubmitters}
            />

            {/* 2. 제출자 목록 */}
            {stats.totalSubmitters > 0 && (
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
    );
}
