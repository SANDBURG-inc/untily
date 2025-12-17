import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from './StatCard';

/**
 * 문서함 제출 현황 섹션
 *
 * - 지정 제출자 있음 (hasDesignatedSubmitters=true):
 *   2행 3열로 생성일, 마감일, 제출자, 제출완료, 미제출, 진행률 표시
 * - 지정 제출자 없음 (hasDesignatedSubmitters=false):
 *   1행 3열로 생성일, 마감일, 제출자만 표시
 */
interface SubmissionStatsProps {
    /** 문서함 생성일 */
    createdAt: Date;
    /** 문서함 마감일 */
    endDate: Date;
    /** 전체 제출자 수 */
    totalSubmitters: number;
    /** 제출 완료 수 (모든 필수 서류 제출) */
    submittedCount: number;
    /** 미제출 수 */
    notSubmittedCount: number;
    /** 진행률 (0-100) */
    submissionRate: number;
    /** 지정 제출자 여부 (null은 true로 취급 - 후방호환성) */
    hasDesignatedSubmitters: boolean;
}

export function SubmissionStats({
    createdAt,
    endDate,
    totalSubmitters,
    submittedCount,
    notSubmittedCount,
    submissionRate,
    hasDesignatedSubmitters,
}: SubmissionStatsProps) {
    // 날짜 포맷: YYYY-MM-DD
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    return (
        <Card className="mb-6 py-0 gap-0 border border-gray-200 shadow-none">
            <CardHeader className="px-6 pt-6 pb-3">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                    <FileText className="w-6 h-6 text-gray-700" />
                    제출 현황
                </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
                {hasDesignatedSubmitters ? (
                    // 지정 제출자 있는 경우: 2행 3열
                    <div className="grid grid-cols-3 gap-4">
                        <StatCard label="생성일" value={formatDate(createdAt)} />
                        <StatCard label="마감일" value={formatDate(endDate)} />
                        <StatCard label="제출자" value={`${totalSubmitters}명`} />
                        <StatCard
                            label="제출완료"
                            value={`${submittedCount}명`}
                            valueClassName="text-green-600"
                        />
                        <StatCard
                            label="미제출"
                            value={`${notSubmittedCount}명`}
                            valueClassName="text-orange-500"
                        />
                        <StatCard
                            label="진행률"
                            value={`${submissionRate}%`}
                            valueClassName="text-blue-600"
                        />
                    </div>
                ) : (
                    // 지정 제출자 없는 경우: 1행 3열
                    <div className="grid grid-cols-3 gap-4">
                        <StatCard label="생성일" value={formatDate(createdAt)} />
                        <StatCard label="마감일" value={formatDate(endDate)} />
                        <StatCard label="제출자" value={`${totalSubmitters}명`} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
