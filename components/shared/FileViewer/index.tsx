'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IconButton } from '@/components/shared/IconButton';
import { Download, X, FileWarning } from 'lucide-react';
import { isImageMimeType, isPdfMimeType } from '@/lib/utils/file';

interface FileViewerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: {
        filename: string;
        mimeType: string;
        previewUrl: string;
    } | null;
    onDownload: () => void;
}

export function FileViewer({ open, onOpenChange, file, onDownload }: FileViewerProps) {
    if (!file) return null;

    const isImage = isImageMimeType(file.mimeType);
    const isPdf = isPdfMimeType(file.mimeType);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90vw] max-w-6xl max-h-[90vh] p-0 overflow-hidden flex flex-col" showCloseButton={false}>
                <DialogHeader className="px-6 pt-6 pb-3 border-b">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-semibold truncate pr-4">
                            {file.filename}
                        </DialogTitle>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <IconButton
                                variant="secondary"
                                size="sm"
                                icon={<Download className="w-4 h-4" />}
                                onClick={onDownload}
                            >
                                다운로드
                            </IconButton>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto p-6">
                    {isImage && (
                        <div className="flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={file.previewUrl}
                                alt={file.filename}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                            />
                        </div>
                    )}

                    {isPdf && (
                        <iframe
                            src={file.previewUrl}
                            className="w-full h-[70vh] rounded-lg border"
                            title={file.filename}
                        />
                    )}

                    {!isImage && !isPdf && (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                            <FileWarning className="w-16 h-16 mb-4" />
                            <p className="text-lg font-medium mb-2">
                                미리보기를 지원하지 않는 파일 형식입니다
                            </p>
                            <p className="text-sm mb-4">
                                다운로드하여 확인해주세요
                            </p>
                            <IconButton
                                variant="primary"
                                icon={<Download className="w-4 h-4" />}
                                onClick={onDownload}
                            >
                                파일 다운로드
                            </IconButton>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
