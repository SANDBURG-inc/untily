'use client';

import { FileText, Download } from 'lucide-react';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { IconButton } from '@/components/shared/IconButton';
import { SubmittedFileItem } from './SubmittedFileItem';

interface SubmittedFile {
    submittedDocumentId: string;
    filename: string;
    size: number;
    mimeType: string;
    documentTitle: string;
}

interface SubmittedFileListProps {
    files: SubmittedFile[];
    documentBoxId: string;
    onPreview: (fileId: string) => void;
    onDownloadAll: () => void;
    isDownloadingAll: boolean;
}

export function SubmittedFileList({
    files,
    documentBoxId,
    onPreview,
    onDownloadAll,
    isDownloadingAll,
}: SubmittedFileListProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <SectionHeader
                    icon={FileText}
                    title={`제출 파일 (${files.length}개)`}
                    size="sm"
                />
                {files.length > 0 && (
                    <IconButton
                        variant="primary"
                        size="sm"
                        icon={<Download className="w-4 h-4" />}
                        onClick={onDownloadAll}
                        disabled={isDownloadingAll}
                    >
                        {isDownloadingAll ? '다운로드 중...' : '전체 다운로드'}
                    </IconButton>
                )}
            </div>

            {files.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>제출된 파일이 없습니다</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {files.map((file) => (
                        <SubmittedFileItem
                            key={file.submittedDocumentId}
                            file={file}
                            documentBoxId={documentBoxId}
                            onPreview={onPreview}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
