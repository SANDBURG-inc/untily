import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RequiredDocumentCard } from './RequiredDocumentCard';

/**
 * 수집 서류 목록 타입
 */
interface RequiredDocument {
    requiredDocumentId: string;
    documentTitle: string;
    documentDescription: string | null;
    isRequired: boolean;
}

/**
 * 수집 서류 목록 섹션
 * 문서함에서 수집할 서류들을 카드 그리드로 표시
 */
interface RequiredDocumentsListProps {
    /** 수집할 서류 목록 */
    documents: RequiredDocument[];
}

export function RequiredDocumentsList({ documents }: RequiredDocumentsListProps) {
    if (documents.length === 0) {
        return null;
    }

    return (
        <Card className="mb-6 py-0 gap-0 border border-gray-200 shadow-none">
            <CardHeader className="px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                    <FileText className="w-6 h-6 text-gray-700" />
                    수집 서류 목록
                </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                        <RequiredDocumentCard
                            key={doc.requiredDocumentId}
                            title={doc.documentTitle}
                            isRequired={doc.isRequired}
                            description={doc.documentDescription}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
