import { Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/** 양식 파일 정보 */
interface TemplateFile {
    s3Key: string;
    filename: string;
}

/**
 * 수집 서류 목록의 개별 서류 카드
 * 서류명, 필수/선택 여부, 설명, 양식 파일 목록을 표시
 */
interface RequiredDocumentCardProps {
    /** 서류 제목 */
    title: string;
    /** 필수 여부 */
    isRequired: boolean;
    /** 서류 설명 (선택) */
    description?: string | null;
    /** 양식 파일 목록 */
    templates?: TemplateFile[];
    /** 양식 파일 클릭 시 호출 (미리보기) */
    onTemplateClick?: (template: TemplateFile) => void;
}

export function RequiredDocumentCard({
    title,
    isRequired,
    description,
    templates = [],
    onTemplateClick,
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
                <p className="text-xs text-gray-500 whitespace-pre-wrap mb-2">{description}</p>
            )}
            {templates.length > 0 && (
                <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Paperclip className="w-3 h-3" />
                        <span>양식 {templates.length}개</span>
                    </div>
                    <ul className="pl-4 space-y-0.5">
                        {templates.map((template, index) => (
                            <li key={`${template.s3Key}-${index}`}>
                                <button
                                    type="button"
                                    onClick={() => onTemplateClick?.(template)}
                                    className="text-xs text-gray-500 hover:text-gray-700 hover:underline truncate max-w-full text-left"
                                >
                                    {template.filename}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
