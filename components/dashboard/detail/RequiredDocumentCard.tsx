import { cn } from '@/lib/utils';

/**
 * 수집 서류 목록의 개별 서류 카드
 * 서류명, 필수/선택 여부, 설명을 표시
 */
interface RequiredDocumentCardProps {
    /** 서류 제목 */
    title: string;
    /** 필수 여부 */
    isRequired: boolean;
    /** 서류 설명 (선택) */
    description?: string | null;
}

export function RequiredDocumentCard({
    title,
    isRequired,
    description,
}: RequiredDocumentCardProps) {
    return (
        <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{title}</span>
                <span
                    className={cn(
                        'px-2 py-0.5 text-xs rounded-full',
                        isRequired
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                    )}
                >
                    {isRequired ? '필수' : '선택'}
                </span>
            </div>
            {description && (
                <p className="text-xs text-gray-500">{description}</p>
            )}
        </div>
    );
}
