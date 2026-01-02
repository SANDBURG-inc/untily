import { cn } from '@/lib/utils';

/**
 * 제출 현황의 개별 통계 카드
 * 생성일, 마감일, 제출자 수, 제출률 등의 정보를 표시
 */
interface StatCardProps {
    /** 카드 라벨 (예: "생성일", "마감일") */
    label: string;
    /** 표시할 값 */
    value: string;
    /** 값 텍스트 색상 (기본: gray-900) */
    valueClassName?: string;
}

export function StatCard({ label, value, valueClassName }: StatCardProps) {
    return (
        <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className={cn('text-sm font-medium text-gray-900', valueClassName)}>
                {value}
            </div>
        </div>
    );
}
