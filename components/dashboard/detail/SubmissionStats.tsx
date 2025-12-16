import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from './StatCard';

/**
 * 문서함 제출 현황 섹션
 * 생성일, 마감일, 제출자 수, 제출률을 카드 형태로 표시
 */
interface SubmissionStatsProps {
    /** 문서함 생성일 */
    createdAt: Date;
    /** 문서함 마감일 */
    endDate: Date;
    /** 전체 제출자 수 */
    totalSubmitters: number;
    /** 제출률 (0-100) */
    submissionRate: number;
}

export function SubmissionStats({
    createdAt,
    endDate,
    totalSubmitters,
    submissionRate,
}: SubmissionStatsProps) {
    // 날짜 포맷: YYYY-MM-DD
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    return (
        <Card className="mb-6 py-0 gap-0 border border-gray-200 shadow-none">
            <CardHeader className="px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                    <FileText className="w-6 h-6 text-gray-700" />
                    제출 현황
                </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="생성일" value={formatDate(createdAt)} />
                    <StatCard label="마감일" value={formatDate(endDate)} />
                    <StatCard label="제출자" value={`${totalSubmitters}명`} />
                    <StatCard
                        label="제출률"
                        value={`${submissionRate}%`}
                        valueClassName="text-blue-600"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
