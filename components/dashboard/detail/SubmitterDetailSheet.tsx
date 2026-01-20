'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Mail, Phone, Calendar, Loader2 } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { SubmittedFileList } from './SubmittedFileList';
import { FormResponseList } from './FormResponseList';
import { FileViewer } from '@/components/shared/FileViewer';
import type { SubmitterWithFiles } from '@/lib/queries/document-box';
import type { SubmitterFormResponsesData } from '@/lib/types/form-field';

interface SubmitterDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    submitterId: string | null;
    documentBoxId: string;
    documentBoxTitle: string;
}

export function SubmitterDetailSheet({
    open,
    onOpenChange,
    submitterId,
    documentBoxId,
    documentBoxTitle,
}: SubmitterDetailSheetProps) {
    const [submitter, setSubmitter] = useState<SubmitterWithFiles | null>(null);
    const [formResponses, setFormResponses] = useState<SubmitterFormResponsesData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 뷰어 상태
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerFile, setViewerFile] = useState<{
        filename: string;
        mimeType: string;
        previewUrl: string;
        submittedDocumentId: string;
    } | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    // 전체 다운로드 상태
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);

    // 제출자 정보 로드 (파일 + 폼 응답 병렬 조회)
    useEffect(() => {
        if (!open || !submitterId) {
            setSubmitter(null);
            setFormResponses(null);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // 파일과 폼 응답을 병렬로 조회
                const [filesRes, responsesRes] = await Promise.all([
                    fetch(`/api/document-box/${documentBoxId}/submitter/${submitterId}/files`),
                    fetch(`/api/document-box/${documentBoxId}/submitter/${submitterId}/responses`),
                ]);

                if (!filesRes.ok) {
                    throw new Error('제출자 정보를 불러올 수 없습니다.');
                }

                const filesData = await filesRes.json();
                setSubmitter(filesData);

                // 폼 응답은 없을 수 있음 (폼 필드가 없는 문서함)
                if (responsesRes.ok) {
                    const responsesData = await responsesRes.json();
                    setFormResponses(responsesData);
                } else {
                    setFormResponses(null);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [open, submitterId, documentBoxId]);

    // 미리보기 핸들러
    const handlePreview = useCallback(async (fileId: string) => {
        setIsLoadingPreview(true);

        try {
            const res = await fetch(
                `/api/submitted-document/${fileId}/preview?documentBoxId=${documentBoxId}`
            );

            if (!res.ok) throw new Error('미리보기를 불러올 수 없습니다.');

            const data = await res.json();
            setViewerFile({
                ...data,
                submittedDocumentId: fileId,
            });
            setViewerOpen(true);
        } catch (err) {
            alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
        } finally {
            setIsLoadingPreview(false);
        }
    }, [documentBoxId]);

    // 뷰어에서 다운로드 핸들러
    const handleViewerDownload = useCallback(async () => {
        if (!viewerFile) return;

        try {
            const res = await fetch(
                `/api/submitted-document/${viewerFile.submittedDocumentId}/download?documentBoxId=${documentBoxId}`
            );
            const { downloadUrl } = await res.json();
            window.open(downloadUrl, '_blank');
        } catch (error) {
            console.error('Download error:', error);
            alert('다운로드 중 오류가 발생했습니다.');
        }
    }, [viewerFile, documentBoxId]);

    // 전체 다운로드 핸들러
    const handleDownloadAll = useCallback(async () => {
        if (!submitter || submitter.files.length === 0) return;

        setIsDownloadingAll(true);

        try {
            if (submitter.files.length === 1) {
                // 파일 1개: 개별 다운로드
                const file = submitter.files[0];
                const res = await fetch(
                    `/api/submitted-document/${file.submittedDocumentId}/download?documentBoxId=${documentBoxId}`
                );
                const { downloadUrl } = await res.json();
                window.open(downloadUrl, '_blank');
            } else {
                // 여러 파일: ZIP 다운로드
                const response = await fetch(
                    `/api/document-box/${documentBoxId}/files?submitterIds=${submitter.submitterId}`
                );

                if (!response.ok) throw new Error('다운로드에 실패했습니다.');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${documentBoxTitle}_${submitter.name}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Download all error:', error);
            alert('다운로드 중 오류가 발생했습니다.');
        } finally {
            setIsDownloadingAll(false);
        }
    }, [submitter, documentBoxId, documentBoxTitle]);

    // 날짜 포맷
    const formatDate = (date: Date | string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="w-[85vw] sm:w-[60vw] lg:w-[50vw] max-w-[800px] overflow-y-auto p-6">
                    <SheetHeader className="mb-6">
                        <SheetTitle>제출자 상세</SheetTitle>
                    </SheetHeader>

                    {isLoading && (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-16 text-red-500">
                            <p>{error}</p>
                        </div>
                    )}

                    {submitter && !isLoading && (
                        <div className="space-y-6">
                            {/* 제출자 정보 */}
                            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <span className="text-lg font-semibold">{submitter.name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{submitter.email}</span>
                                </div>
                                {submitter.phone && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{submitter.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>제출일: {formatDate(submitter.lastSubmittedAt)}</span>
                                </div>
                            </div>

                            {/* 폼 응답 - 파일 목록 위에 표시 */}
                            {formResponses?.hasResponses && (
                                <FormResponseList groups={formResponses.groups} />
                            )}

                            {/* 제출 파일 목록 */}
                            <SubmittedFileList
                                files={submitter.files}
                                documentBoxId={documentBoxId}
                                onPreview={handlePreview}
                                onDownloadAll={handleDownloadAll}
                                isDownloadingAll={isDownloadingAll}
                            />
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* 파일 뷰어 */}
            <FileViewer
                open={viewerOpen}
                onOpenChange={setViewerOpen}
                file={viewerFile}
                onDownload={handleViewerDownload}
            />

            {/* 미리보기 로딩 오버레이 */}
            {isLoadingPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
            )}
        </>
    );
}
