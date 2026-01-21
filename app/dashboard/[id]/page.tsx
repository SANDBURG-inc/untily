import { Edit, Send } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';

import { IconButton } from '@/components/shared/IconButton';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusChangeDropdown } from '@/components/dashboard/StatusChangeDropdown';
import {
    SubmissionStats,
    SubmittersList,
    RequiredDocumentsList,
    ReminderHistory,
} from '@/components/dashboard/detail';
import { ensureAuthenticated } from '@/lib/auth';
import {
    getDocumentBoxAccessInfo,
    getDocumentBoxWithSubmissionStatus,
} from '@/lib/queries/document-box';
import { calculateSubmissionStats, hasDesignatedSubmitters } from '@/lib/utils/document-box';

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

    // 1. 문서함 접근 권한 확인
    const accessInfo = await getDocumentBoxAccessInfo(id, user.id, user.email || '');

    // 문서함이 존재하지 않음 → 404
    if (!accessInfo) {
        notFound();
    }

    // 2. 소유자가 아니면 제출 페이지로 리다이렉트
    if (!accessInfo.isOwner) {
        if (!hasDesignatedSubmitters(accessInfo.hasSubmitter)) {
            // 공개 제출 문서함 → /submit/[documentBoxId]
            redirect(`/submit/${id}`);
        } else if (accessInfo.submitterId) {
            // 제출자 지정 문서함 + 등록된 제출자 → /submit/[documentBoxId]/[submitterId]
            redirect(`/submit/${id}/${accessInfo.submitterId}`);
        } else {
            // 제출자 지정 문서함 + 미등록 → 404
            notFound();
        }
    }

    // 3. 소유자면 상세 정보 조회
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
            {/* 페이지 헤더: 문서함 제목 + 상태 + 수정 버튼 */}
            <PageHeader
                title={documentBox.boxTitle}
                description={documentBox.boxDescription || '제출할 서류를 확인하세요.'}
                statusBadge={
                    <StatusChangeDropdown
                        documentBoxId={id}
                        currentStatus={documentBox.status}
                        size="lg"
                    />
                }
                actions={
                    <>
                        <IconButton
                            as="link"
                            href={`/dashboard/${id}/edit`}
                            variant="secondary"
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
            <SubmittersList
                submitters={documentBox.submitters}
                documentBoxId={id}
                documentBoxTitle={documentBox.boxTitle}
                endDate={documentBox.endDate}
            />
            {/* 3. 수집 서류 목록 */}
            <RequiredDocumentsList documents={documentBox.requiredDocuments} />

            {/* 4. 리마인드 내역 */}
            {stats.hasDesignatedSubmitters && (
                <ReminderHistory
                    documentBoxId={id}
                    autoReminderEnabled={
                        documentBox.reminderSchedules.some(s => s.isEnabled) ||
                        documentBox.documentBoxRemindTypes.length > 0
                    }
                    reminderLogs={documentBox.reminderLogs}
                    reminderSchedules={documentBox.reminderSchedules}
                />
            )}
        </main>
    );
}
