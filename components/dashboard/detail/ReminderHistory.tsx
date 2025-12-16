import { History, Bell } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { AutoReminderSettings } from '../AutoReminderSettings';

/**
 * 리마인드 로그 타입
 */
interface ReminderRecipient {
    submitter: {
        name: string;
    };
}

interface ReminderLog {
    id: string;
    sentAt: Date;
    channel: 'EMAIL' | 'SMS' | 'PUSH';
    isAuto: boolean;
    recipients: ReminderRecipient[];
}

/**
 * 리마인드 내역 섹션
 * 자동 리마인드 설정 + 리마인드 발송 기록 테이블
 */
interface ReminderHistoryProps {
    /** 문서함 ID */
    documentBoxId: string;
    /** 자동 리마인드 활성화 여부 */
    autoReminderEnabled: boolean;
    /** 리마인드 로그 목록 */
    reminderLogs: ReminderLog[];
}

/** 채널명 한글 변환 */
function getChannelLabel(channel: ReminderLog['channel']): string {
    switch (channel) {
        case 'EMAIL':
            return '이메일';
        case 'SMS':
            return '문자';
        case 'PUSH':
            return '앱 푸시';
    }
}

/** 수신자 텍스트 생성 */
function getRecipientText(recipients: ReminderRecipient[]): string {
    const count = recipients.length;
    if (count === 0) return '수신자 없음';
    if (count === 1) return recipients[0].submitter.name;
    return `${recipients[0].submitter.name} 외 ${count - 1}명`;
}

export function ReminderHistory({
    documentBoxId,
    autoReminderEnabled,
    reminderLogs,
}: ReminderHistoryProps) {
    return (
        <Card className="py-0 gap-0 border border-gray-200 shadow-none">
            <CardHeader className="px-6 pt-6 pb-3">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                    <History className="w-6 h-6 text-gray-700" />
                    리마인드 내역
                </CardTitle>
                <CardAction>
                    <Button variant="outline-primary" asChild>
                        <Link href={`/dashboard/${documentBoxId}/send`}>
                            <Bell className="w-4 h-4" />
                            리마인드 발송
                        </Link>
                    </Button>
                </CardAction>
            </CardHeader>

            <CardContent className="px-6 pt-0 pb-6">
                {/* 자동 리마인드 설정 */}
                <AutoReminderSettings
                    documentBoxId={documentBoxId}
                    initialEnabled={autoReminderEnabled}
                />

                {/* 리마인드 로그 테이블 */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                                    수신자
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                                    리마인드 발송일
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                                    리마인드 채널
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                                    발송
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {reminderLogs.length > 0 ? (
                                reminderLogs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                                    >
                                        <td className="py-3 px-4 text-sm text-gray-900 font-medium hover:text-blue-600">
                                            <Link href={`/dashboard/${documentBoxId}/reminders/${log.id}`}>
                                                {getRecipientText(log.recipients)}
                                            </Link>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            {log.sentAt.toISOString().split('T')[0]}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            {getChannelLabel(log.channel)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            {log.isAuto ? '자동발송' : '직접발송'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="py-8 text-center text-sm text-gray-500"
                                    >
                                        발송된 리마인드 내역이 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
