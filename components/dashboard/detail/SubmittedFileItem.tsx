'use client';

import { useState } from 'react';
import { ScanEye, Download, Image, FileText, File } from 'lucide-react';
import { formatFileSize, isPreviewSupported, getFileIconType } from '@/lib/utils/file';

interface SubmittedFileItemProps {
    file: {
        submittedDocumentId: string;
        filename: string;
        size: number;
        mimeType: string;
        documentTitle: string;
    };
    documentBoxId: string;
    onPreview: (fileId: string) => void;
}

const FileIcon = ({ type }: { type: 'image' | 'pdf' | 'document' }) => {
    const iconClass = "w-5 h-5";
    switch (type) {
        case 'image':
            return <Image className={`${iconClass} text-blue-500`} />;
        case 'pdf':
            return <FileText className={`${iconClass} text-red-500`} />;
        default:
            return <File className={`${iconClass} text-gray-500`} />;
    }
};

export function SubmittedFileItem({ file, documentBoxId, onPreview }: SubmittedFileItemProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const iconType = getFileIconType(file.mimeType);
    const canPreview = isPreviewSupported(file.mimeType);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const res = await fetch(
                `/api/submitted-document/${file.submittedDocumentId}/download?documentBoxId=${documentBoxId}`
            );
            const { downloadUrl } = await res.json();
            window.open(downloadUrl, '_blank');
        } catch (error) {
            console.error('Download error:', error);
            alert('다운로드 중 오류가 발생했습니다.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0">
                <FileIcon type={iconType} />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                    {file.filename}
                </p>
                <p className="text-xs text-gray-500">
                    {file.documentTitle} • {formatFileSize(file.size)}
                </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
                {canPreview && (
                    <button
                        onClick={() => onPreview(file.submittedDocumentId)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="미리보기"
                    >
                        <ScanEye className="w-4 h-4 text-gray-600" />
                    </button>
                )}
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    title="다운로드"
                >
                    <Download className="w-4 h-4 text-gray-600" />
                </button>
            </div>
        </div>
    );
}
