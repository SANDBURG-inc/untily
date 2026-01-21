'use client';

import { FileText, Download, HelpCircle } from 'lucide-react';
import { IconButton } from '@/components/shared/IconButton';
import { SubmittedFileItem } from './SubmittedFileItem';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

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
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* 섹션 헤더 - 컨테이너 안에 통합 */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                        제출 파일 ({files.length}개)
                    </span>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p className="text-xs">
                                    문서명은 일정한 형식으로 자동 변경됩니다.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
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

            {/* 파일 목록 - 흰 배경, divide-y로 구분 */}
            {files.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>제출된 파일이 없습니다</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
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
