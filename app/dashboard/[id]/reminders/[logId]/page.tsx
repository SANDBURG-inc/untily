/**
 * 리마인드 로그 상세 페이지
 *
 * 특정 리마인드 발송 내역의 상세 정보를 표시합니다.
 * 수신자 목록, 제출 상태, 발송 채널 등을 페이지네이션과 함께 제공합니다.
 *
 * @module app/dashboard/[id]/reminders/[logId]/page
 */

import { History } from 'lucide-react';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/shared/PageHeader';
import { Pagination } from '@/components/shared/Pagination';
import { Table, Column } from '@/components/shared/Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ensureAuthenticated } from '@/lib/auth';
import {
    getReminderLogDetail,
    getPaginatedReminderRecipients,
    type PaginatedRecipient,
} from '@/lib/queries/reminder';
import {
    getReminderChannelLabel,
    formatReminderRecipientsCount,
    type ReminderChannelType,
} from '@/lib/types/reminder';

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZE = 10;

// ============================================================================
// Types
// ============================================================================

/** 테이블에 표시할 수신자 행 데이터 */
interface RecipientRow extends PaginatedRecipient {
    sentAt: Date;
    channel: ReminderChannelType;
    isAuto: boolean;
}

// ============================================================================
// Page Component
// ============================================================================

export default async function ReminderLogDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string; logId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    await ensureAuthenticated();

    const { id: documentBoxId, logId } = await params;
    const { page } = await searchParams;
    const currentPage = typeof page === 'string' ? Math.max(1, parseInt(page)) : 1;

    // 1. 로그 상세 정보 조회
    const detail = await getReminderLogDetail(logId, documentBoxId, PAGE_SIZE);
    if (!detail) notFound();

    // 2. 페이지네이션된 수신자 목록 조회
    const { recipients, totalPages } = await getPaginatedReminderRecipients(
        logId,
        documentBoxId,
        detail.totalRequiredDocs,
        currentPage,
        PAGE_SIZE
    );

    // 3. 페이지 타이틀 생성
    const title = formatReminderRecipientsCount(
        detail.firstRecipientName,
        detail.totalRecipients
    );

    // 4. 테이블 데이터 변환 (로그 정보 병합)
    const tableData: RecipientRow[] = recipients.map((recipient) => ({
        ...recipient,
        sentAt: detail.log.sentAt,
        channel: detail.log.channel,
        isAuto: detail.log.isAuto,
    }));

    // 5. 테이블 컬럼 정의
    const columns: Column<RecipientRow>[] = [
        {
            key: 'name',
            header: '수신자',
            render: (row) => (
                <span className="text-sm text-gray-900">{row.name}</span>
            ),
        },
        {
            key: 'status',
            header: '제출상태',
            render: (row) => (
                <Badge variant={row.isComplete ? 'success' : 'destructive'}>
                    {row.isComplete ? '제출완료' : '미제출'}
                </Badge>
            ),
        },
        {
            key: 'sentAt',
            header: '리마인드 발송일',
            render: (row) => (
                <span className="text-sm text-gray-600">
                    {row.sentAt.toISOString().split('T')[0]}
                </span>
            ),
        },
        {
            key: 'channel',
            header: '리마인드 채널',
            render: (row) => (
                <span className="text-sm text-gray-600">
                    {getReminderChannelLabel(row.channel)}
                </span>
            ),
        },
        {
            key: 'isAuto',
            header: '발송',
            render: (row) => (
                <span className="text-sm text-gray-600">
                    {row.isAuto ? '자동발송' : '직접발송'}
                </span>
            ),
        },
    ];

    return (
        <main className="container mx-auto max-w-6xl px-4 py-8">
            <PageHeader
                title={title}
                description="리마인드 상세 내용을 확인해보세요."
            />

            <Card className="py-0 gap-0 border border-gray-200 shadow-none">
                <CardHeader className="px-6 pt-6 pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                        <History className="w-5 h-5 text-gray-700" />
                        리마인드 내역
                    </CardTitle>
                </CardHeader>

                <CardContent className="px-6 pt-0 pb-6">
                    <Table
                        columns={columns}
                        data={tableData}
                        keyExtractor={(row) => row.id}
                        emptyMessage="수신자 정보가 없습니다."
                    />

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        createPageUrl={(page) =>
                            `/dashboard/${documentBoxId}/reminders/${logId}?page=${page}`
                        }
                    />
                </CardContent>
            </Card>
        </main>
    );
}
