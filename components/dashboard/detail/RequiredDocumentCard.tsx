import { Badge } from '@/components/ui/badge';

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
                <Badge variant={isRequired ? 'required' : 'optional'}>
                    {isRequired ? '필수' : '선택'}
                </Badge>
            </div>
            {description && (
                <p className="text-xs text-gray-500 whitespace-pre-wrap">{description}</p>
            )}
        </div>
    );
}
