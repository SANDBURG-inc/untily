import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RequiredDocumentCard } from './RequiredDocumentCard';
import { SectionHeader } from '@/components/shared/SectionHeader';

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
        <Card variant="compact" className="mb-6">
            <CardHeader variant="compact">
                <CardTitle>
                    <SectionHeader icon={FileText} title="수집 서류 목록" />
                </CardTitle>
            </CardHeader>
            <CardContent variant="compact">
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
