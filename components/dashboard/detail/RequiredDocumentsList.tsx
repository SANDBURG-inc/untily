'use client';

import { useCallback } from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RequiredDocumentCard } from './RequiredDocumentCard';
import { SectionHeader } from '@/components/shared/SectionHeader';

/** 양식 파일 정보 */
interface TemplateFile {
    s3Key: string;
    filename: string;
}

/**
 * 수집 서류 목록 타입
 */
interface RequiredDocument {
    requiredDocumentId: string;
    documentTitle: string;
    documentDescription: string | null;
    isRequired: boolean;
    templates?: TemplateFile[] | null;
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
    // 양식 파일 미리보기 핸들러 (새 탭에서 열기)
    const handleTemplatePreview = useCallback(
        async (requiredDocumentId: string, template: TemplateFile) => {
            try {
                const params = new URLSearchParams({
                    s3Key: template.s3Key,
                    requiredDocumentId,
                });
                const res = await fetch(`/api/template/preview?${params}`);

                if (!res.ok) {
                    console.error('미리보기 URL 생성 실패');
                    return;
                }

                const { previewUrl } = await res.json();
                window.open(previewUrl, '_blank');
            } catch (error) {
                console.error('양식 파일 미리보기 오류:', error);
            }
        },
        []
    );

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
                            templates={doc.templates || []}
                            onTemplateClick={(template) =>
                                handleTemplatePreview(doc.requiredDocumentId, template)
                            }
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
