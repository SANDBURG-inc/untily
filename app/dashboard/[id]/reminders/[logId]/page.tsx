/**
 * 리마인드 로그 상세 페이지
 *
 * 특정 리마인드 발송 내역의 상세 정보를 표시합니다.
 * 수신자 목록, 제출 상태, 발송 채널 등을 페이지네이션과 함께 제공합니다.
 *
 * @module app/dashboard/[id]/reminders/[logId]/page
 */

import { History } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/shared/PageHeader';
import { Table, Column } from '@/components/shared/Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import prisma from '@/lib/db';
import { ensureAuthenticated } from '@/lib/auth';
import {
    getReminderChannelLabel,
    formatReminderRecipientsCount,
    type ReminderChannelType,
} from '@/lib/types/reminder';

// ============================================================================
// Types
// ============================================================================

/** 테이블에 표시할 수신자 행 데이터 */
interface RecipientRow {
    id: string;
    name: string;
    isComplete: boolean;
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

    // 2.2 Fetch Total Required Documents count for the box
    const totalRequiredDocs = await prisma.requiredDocument.count({
        where: { documentBoxId: id },
    });

    // 3. Fetch Paginated Recipients
    const recipients = await prisma.reminderRecipient.findMany({
        where: { reminderLogId: logId },
        include: {
            submitter: {
                include: {
                    submittedDocuments: {
                        where: {
                            requiredDocument: {
                                documentBoxId: id,
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            submitter: {
                name: 'asc',
            },
        },
        take: pageSize,
        skip: (currentPage - 1) * pageSize,
    });

    // 4. Fetch Representative Recipient for Title
    const representativeRecipient = await prisma.reminderRecipient.findFirst({
        where: { reminderLogId: logId },
        include: { submitter: true },
        orderBy: {
            submitter: {
                name: 'asc',
            },
        },
    });

    const firstRecipientName = representativeRecipient?.submitter.name ?? '알 수 없음';
    const title = formatReminderRecipientsCount(firstRecipientName, totalCount);

    // 5. Transform recipients to table row data
    const tableData: RecipientRow[] = recipients.map((recipient) => {
        const submittedCount = recipient.submitter.submittedDocuments.length;
        const isComplete =
            totalRequiredDocs > 0 ? submittedCount >= totalRequiredDocs : false;

        return {
            id: recipient.id,
            name: recipient.submitter.name,
            isComplete,
            sentAt: log.sentAt,
            channel: log.channel as ReminderChannelType,
            isAuto: log.isAuto,
        };
    });

    // 6. Define table columns
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

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 px-2">
                        <span className="text-sm text-gray-500">
                            {currentPage} / {totalPages > 0 ? totalPages : 1}
                        </span>
                        <div className="flex gap-2">
                            {currentPage > 1 ? (
                                <Button variant="secondary" size="sm" asChild>
                                    <Link
                                        href={`/dashboard/${id}/reminders/${logId}?page=${currentPage - 1}`}
                                    >
                                        이전
                                    </Link>
                                </Button>
                            ) : (
                                <Button variant="secondary" size="sm" disabled>
                                    이전
                                </Button>
                            )}

                            {currentPage < totalPages ? (
                                <Button variant="secondary" size="sm" asChild>
                                    <Link
                                        href={`/dashboard/${id}/reminders/${logId}?page=${currentPage + 1}`}
                                    >
                                        다음
                                    </Link>
                                </Button>
                            ) : (
                                <Button variant="secondary" size="sm" disabled>
                                    다음
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
