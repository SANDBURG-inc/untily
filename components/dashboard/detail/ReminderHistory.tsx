/**
 * 리마인드 내역 컴포넌트
 *
 * 문서함의 리마인드 발송 내역을 테이블로 표시하고,
 * 자동 리마인드 설정 기능을 제공합니다.
 *
 * @module components/dashboard/detail/ReminderHistory
 */

import { History, Bell } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { IconButton } from '@/components/shared/IconButton';
import { Table, Column } from '@/components/shared/Table';
import { AutoReminderSettings } from '../AutoReminderSettings';
import {
    type ReminderLog,
    getReminderChannelLabel,
    formatReminderRecipients,
} from '@/lib/types/reminder';

// ============================================================================
// Props Interface
// ============================================================================

interface ReminderHistoryProps {
    /** 문서함 ID */
    documentBoxId: string;
    /** 자동 리마인드 활성화 여부 */
    autoReminderEnabled: boolean;
    /** 리마인드 로그 목록 */
    reminderLogs: ReminderLog[];
}

// ============================================================================
// Main Component
// ============================================================================

export function ReminderHistory({
    documentBoxId,
    autoReminderEnabled,
    reminderLogs,
}: ReminderHistoryProps) {
    /** 테이블 컬럼 정의 */
    const columns: Column<ReminderLog>[] = [
        {
            key: 'recipient',
            header: '수신자',
            render: (log) => (
                <Link
                    href={`/dashboard/${documentBoxId}/reminders/${log.id}`}
                    className="text-sm text-gray-900 font-medium hover:text-blue-600"
                >
                    {formatReminderRecipients(log.recipients)}
                </Link>
            ),
        },
        {
            key: 'sentAt',
            header: '리마인드 발송일',
            render: (log) => (
                <span className="text-sm text-gray-600">
                    {log.sentAt.toISOString().split('T')[0]}
                </span>
            ),
        },
        {
            key: 'channel',
            header: '리마인드 채널',
            render: (log) => (
                <span className="text-sm text-gray-600">
                    {getReminderChannelLabel(log.channel)}
                </span>
            ),
        },
        {
            key: 'isAuto',
            header: '발송',
            render: (log) => (
                <span className="text-sm text-gray-600">
                    {log.isAuto ? '자동발송' : '직접발송'}
                </span>
            ),
        },
    ];

    return (
        <Card className="py-0 gap-0 border border-gray-200 shadow-none">
            <CardHeader className="px-6 pt-6 pb-3">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                    <History className="w-6 h-6 text-gray-700" />
                    리마인드 내역
                </CardTitle>
                <CardAction>
                    <IconButton
                        as="link"
                        href={`/dashboard/${documentBoxId}/send`}
                        variant="outline-primary"
                        icon={<Bell className="w-4 h-4" />}
                    >
                        리마인드 발송
                    </IconButton>
                </CardAction>
            </CardHeader>

            <CardContent className="px-6 pt-0 pb-6">
                {/* 자동 리마인드 설정 */}
                <AutoReminderSettings
                    documentBoxId={documentBoxId}
                    initialEnabled={autoReminderEnabled}
                />

                {/* 리마인드 로그 테이블 */}
                <Table
                    columns={columns}
                    data={reminderLogs}
                    keyExtractor={(log) => log.id}
                    emptyMessage="발송된 리마인드 내역이 없습니다."
                />
            </CardContent>
        </Card>
    );
}
