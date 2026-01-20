'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Users, Download, FileArchive, FileText, ClockAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IconButton } from '@/components/shared/IconButton';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Table, Column } from '@/components/shared/Table';
import { downloadCsv } from '@/lib/utils/csv-export';
import type { SubmitterWithStatus } from '@/lib/queries/document-box';
import {
    type StatusFilter,
    STATUS_FILTER_OPTIONS,
    getSubmissionStatus,
    getStatusStyle,
    formatProgress,
    formatSubmissionDate,
} from '@/lib/types/submitter';
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver';
import { SubmitterDetailSheet } from './SubmitterDetailSheet';

/**
 * 제출자 목록 컴포넌트
 * 체크박스 선택, CSV 다운로드, 접기/펼치기 기능 제공
 */
interface SubmittersListProps {
    /** 제출자 목록 (제출 상태 포함) */
    submitters: SubmitterWithStatus[];
    /** 문서함 ID */
    documentBoxId: string;
    /** 문서함 제목 (CSV 파일명에 사용) */
    documentBoxTitle: string;
    /** 필수 서류 총 개수 */
    totalRequiredDocuments: number;
    /** 문서함 마감일 (늦은 제출 표시용) */
    endDate: Date;
}

const INITIAL_DISPLAY_COUNT = 20;
const LOAD_MORE_COUNT = 20;

// 마감일 이후 제출 여부 판단
const isLateSubmission = (submittedAt: Date | null, deadline: Date): boolean => {
    if (!submittedAt) return false;
    return new Date(submittedAt) > new Date(deadline);
};

export function SubmittersList({
    submitters,
    documentBoxId,
    documentBoxTitle,
    totalRequiredDocuments,
    endDate,
}: SubmittersListProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [isDownloadingFiles, setIsDownloadingFiles] = useState(false);
    const [isDownloadingResponses, setIsDownloadingResponses] = useState(false);

    // Sheet 상태
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedSubmitterId, setSelectedSubmitterId] = useState<string | null>(null);

    // 필터링된 제출자 목록
    const filteredSubmitters = useMemo(() => {
        if (statusFilter === 'all') return submitters;
        return submitters.filter(s => {
            const status = getSubmissionStatus(s.submittedCount, totalRequiredDocuments);
            return status === statusFilter;
        });
    }, [submitters, statusFilter, totalRequiredDocuments]);

    const displayedSubmitters = useMemo(() => {
        return filteredSubmitters.slice(0, displayCount);
    }, [filteredSubmitters, displayCount]);

    const handleLoadMore = useCallback(() => {
        setDisplayCount((prev) => Math.min(prev + LOAD_MORE_COUNT, filteredSubmitters.length));
    }, [filteredSubmitters.length]);

    const observerRef = useIntersectionObserver({
        onIntersect: handleLoadMore,
    });

    // 필터 변경 시 displayCount 초기화
    useEffect(() => {
        setDisplayCount(INITIAL_DISPLAY_COUNT);
    }, [statusFilter]);

    const allSelected = useMemo(() => {
        return submitters.length > 0 && selectedIds.size === submitters.length;
    }, [submitters.length, selectedIds.size]);

    const handleSelectAll = useCallback(() => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(submitters.map(s => s.submitterId)));
        }
    }, [allSelected, submitters]);

    const handleSelectOne = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return newSelected;
        });
    }, []);

    // 이름 클릭 시 Sheet 열기
    const handleNameClick = useCallback((submitterId: string) => {
        setSelectedSubmitterId(submitterId);
        setSheetOpen(true);
    }, []);

    const columns: Column<SubmitterWithStatus>[] = useMemo(() => [
        {
            key: 'checkbox',
            header: (
                <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                />
            ),
            render: (submitter) => (
                <Checkbox
                    checked={selectedIds.has(submitter.submitterId)}
                    onCheckedChange={() => handleSelectOne(submitter.submitterId)}
                />
            ),
        },
        {
            key: 'name',
            header: '이름',
            render: (submitter) => (
                <button
                    onClick={() => handleNameClick(submitter.submitterId)}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
                >
                    {submitter.name}
                </button>
            ),
        },
        {
            key: 'email',
            header: '이메일',
            render: (submitter) => (
                <span className="text-sm text-gray-600">{submitter.email}</span>
            ),
        },
        {
            key: 'phone',
            header: '연락처',
            render: (submitter) => (
                <span className="text-sm text-gray-600">{submitter.phone || '-'}</span>
            ),
        },
        {
            key: 'status',
            header: '제출상태',
            render: (submitter) => {
                const status = getSubmissionStatus(submitter.submittedCount, totalRequiredDocuments);
                return (
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusStyle(status)}`}>
                        {status}
                    </span>
                );
            },
        },
        {
            key: 'lastDate',
            header: '제출일',
            render: (submitter) => {
                const isLate = isLateSubmission(submitter.lastSubmittedAt, endDate);
                return (
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                        {formatSubmissionDate(submitter.lastSubmittedAt)}
                        {isLate && (
                            <ClockAlert className="w-3.5 h-3.5 text-orange-500" />
                        )}
                    </span>
                );
            },
        },
        {
            key: 'progress',
            header: '진행상황',
            render: (submitter) => (
                <span className="text-sm text-gray-600">
                    {formatProgress(submitter.submittedCount, totalRequiredDocuments)}
                </span>
            ),
        },
        {
            key: 'action',
            header: '',
            render: () => <span className="text-sm text-gray-400">...</span>,
        },
    ], [allSelected, selectedIds, totalRequiredDocuments, endDate, handleSelectAll, handleSelectOne, handleNameClick]);

    const handleDownload = () => {
        const headers = ['이름', '이메일', '휴대전화', '제출상태', '제출일', '진행상황'];
        const rows = submitters.map(s => [
            s.name,
            s.email,
            s.phone || '',
            getSubmissionStatus(s.submittedCount, totalRequiredDocuments),
            formatSubmissionDate(s.lastSubmittedAt),
            formatProgress(s.submittedCount, totalRequiredDocuments),
        ]);

        downloadCsv({
            filename: `${documentBoxTitle}_제출자목록.csv`,
            headers,
            rows,
        });
    };

    const handleFilesDownload = async () => {
        setIsDownloadingFiles(true);
        try {
            // 선택된 제출자가 있으면 해당 ID들만, 없으면 전체 다운로드
            const url = selectedIds.size > 0
                ? `/api/document-box/${documentBoxId}/files?submitterIds=${Array.from(selectedIds).join(',')}`
                : `/api/document-box/${documentBoxId}/files`;
            const response = await fetch(url);

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || '파일 다운로드에 실패했습니다.');
                return;
            }

            // Blob으로 변환 후 다운로드
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `${documentBoxTitle}_제출파일.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
        } catch (error) {
            console.error('File download error:', error);
            alert('파일 다운로드 중 오류가 발생했습니다.');
        } finally {
            setIsDownloadingFiles(false);
        }
    };

    // 폼 응답 CSV 다운로드
    const handleFormResponseDownload = async () => {
        setIsDownloadingResponses(true);
        try {
            const response = await fetch(`/api/document-box/${documentBoxId}/responses/export`);

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || '폼 응답 다운로드에 실패했습니다.');
                return;
            }

            // Blob으로 변환 후 다운로드
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `${documentBoxTitle}_폼응답.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Form response download error:', error);
            alert('폼 응답 다운로드 중 오류가 발생했습니다.');
        } finally {
            setIsDownloadingResponses(false);
        }
    };

    return (
        <Card variant="compact" className="mb-6">
            <CardHeader variant="compact">
                <CardTitle>
                    <SectionHeader icon={Users} title="제출자 목록" />
                </CardTitle>

                <CardAction className="flex items-center gap-2">
                    <IconButton
                        variant="secondary"
                        size="sm"
                        icon={<Download className="w-4 h-4" />}
                        onClick={handleDownload}
                    >
                        제출현황
                    </IconButton>
                    <IconButton
                        variant="secondary"
                        size="sm"
                        icon={<FileText className="w-4 h-4" />}
                        onClick={handleFormResponseDownload}
                        disabled={isDownloadingResponses}
                    >
                        {isDownloadingResponses ? '다운로드 중...' : '폼 응답'}
                    </IconButton>
                    {submitters.length > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <IconButton
                                    variant="primary"
                                    size="sm"
                                    icon={<FileArchive className="w-4 h-4" />}
                                    onClick={handleFilesDownload}
                                    disabled={isDownloadingFiles}
                                >
                                    {isDownloadingFiles
                                        ? '다운로드 중...'
                                        : selectedIds.size > 0
                                            ? `다운로드 (${selectedIds.size}명)`
                                            : '전체 다운로드'}
                                </IconButton>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs text-left">
                                <p>폴더/제출자별 폴더/파일들로 정리된 압축파일로 저장됩니다.</p>
                                <p className="mt-1">문서명_제출일자_제출자명 으로 자동 변경되어 저장</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </CardAction>
            </CardHeader>

            <CardContent variant="compact">
                <div className="mb-4">
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="제출상태" />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_FILTER_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                    <Table
                        columns={columns}
                        data={displayedSubmitters}
                        keyExtractor={(s) => s.submitterId}
                    />
                    {displayedSubmitters.length < filteredSubmitters.length && (
                        <div ref={observerRef} className="h-4 w-full" />
                    )}
                </div>
            </CardContent>

            {/* 제출자 상세 Sheet */}
            <SubmitterDetailSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                submitterId={selectedSubmitterId}
                documentBoxId={documentBoxId}
                documentBoxTitle={documentBoxTitle}
            />
        </Card>
    );
}
