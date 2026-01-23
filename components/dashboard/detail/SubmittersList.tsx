'use client';

import { useState, useMemo, useCallback } from 'react';
import { Users, Download, FileArchive, FileText, ClockAlert, RotateCcw, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { IconButton } from '@/components/shared/IconButton';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Table, Column } from '@/components/shared/Table';
import { downloadCsv } from '@/lib/utils/csv-export';
import type { SubmitterWithStatus } from '@/lib/queries/document-box';
import {
    type SubmitterStatus,
    type SubmittedSubmitterStatus,
    hasEverSubmitted,
    SUBMITTER_STATUS_LABELS,
    SUBMITTER_STATUS_STYLES,
    formatSubmissionDate,
} from '@/lib/types/submitter';
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver';
import { SubmitterDetailSheet } from './SubmitterDetailSheet';
import { SubmitterStatusDropdown } from './SubmitterStatusDropdown';
import { CheckedToggle } from './CheckedToggle';

// 제출상태 필터 타입
type StatusFilter = 'all' | SubmitterStatus;

const STATUS_FILTER_OPTIONS_DEFAULT: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'SUBMITTED', label: '제출됨' },
    { value: 'REJECTED', label: '반려됨' },
];

const STATUS_FILTER_OPTIONS_DESIGNATED: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'SUBMITTED', label: '제출됨' },
    { value: 'REJECTED', label: '반려됨' },
    { value: 'PENDING', label: '등록됨' },
];

/**
 * 제출자 목록 컴포넌트
 * - 지정 제출자 문서함: 모든 제출자 표시 (제출/반려 우선 정렬, PENDING은 '등록됨')
 * - 비지정 제출자 문서함: 제출 경험이 있는 사람만 표시 (SUBMITTED 또는 REJECTED)
 * 체크박스 선택, CSV 다운로드 기능 제공
 */
interface SubmittersListProps {
    /** 제출자 목록 (제출 상태 포함) */
    submitters: SubmitterWithStatus[];
    /** 문서함 ID */
    documentBoxId: string;
    /** 문서함 제목 (CSV 파일명에 사용) */
    documentBoxTitle: string;
    /** 문서함 마감일 (늦은 제출 표시용) */
    endDate: Date;
    /** 지정 제출자 문서함 여부 */
    hasDesignatedSubmitters: boolean;
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
    endDate,
    hasDesignatedSubmitters,
}: SubmittersListProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
    const [isDownloadingFiles, setIsDownloadingFiles] = useState(false);
    const [isDownloadingResponses, setIsDownloadingResponses] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    // Sheet 상태
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedSubmitterId, setSelectedSubmitterId] = useState<string | null>(null);

    const statusFilterOptions = hasDesignatedSubmitters
        ? STATUS_FILTER_OPTIONS_DESIGNATED
        : STATUS_FILTER_OPTIONS_DEFAULT;

    // 지정 제출자: 모든 제출자 표시 (제출/반려 우선 정렬)
    // 비지정 제출자: 제출 경험이 있는 제출자만 필터링
    const baseSubmitters = useMemo(() => {
        if (hasDesignatedSubmitters) {
            // SUBMITTED/REJECTED 우선, 그 다음 PENDING (이름 가나다순)
            return [...submitters].sort((a, b) => {
                const aSubmitted = hasEverSubmitted(a.status);
                const bSubmitted = hasEverSubmitted(b.status);
                if (aSubmitted && !bSubmitted) return -1;
                if (!aSubmitted && bSubmitted) return 1;
                if (aSubmitted && bSubmitted) {
                    // 둘 다 제출 경험: 제출일 역순
                    const aDate = a.lastSubmittedAt ? new Date(a.lastSubmittedAt).getTime() : 0;
                    const bDate = b.lastSubmittedAt ? new Date(b.lastSubmittedAt).getTime() : 0;
                    return bDate - aDate;
                }
                // 둘 다 PENDING: 이름 가나다순
                return a.name.localeCompare(b.name, 'ko');
            });
        }
        return submitters.filter(s => hasEverSubmitted(s.status));
    }, [submitters, hasDesignatedSubmitters]);

    // 상태 필터 적용
    const filteredSubmitters = useMemo(() => {
        if (statusFilter === 'all') return baseSubmitters;
        return baseSubmitters.filter(s => s.status === statusFilter);
    }, [baseSubmitters, statusFilter]);

    const displayedSubmitters = useMemo(() => {
        return filteredSubmitters.slice(0, displayCount);
    }, [filteredSubmitters, displayCount]);

    const handleLoadMore = useCallback(() => {
        setDisplayCount((prev) => Math.min(prev + LOAD_MORE_COUNT, filteredSubmitters.length));
    }, [filteredSubmitters.length]);

    const observerRef = useIntersectionObserver({
        onIntersect: handleLoadMore,
    });

    // 현재 필터링된 목록 기준으로 전체 선택 판단
    const allSelected = useMemo(() => {
        return filteredSubmitters.length > 0 && filteredSubmitters.every(s => selectedIds.has(s.submitterId));
    }, [filteredSubmitters, selectedIds]);

    const handleSelectAll = useCallback(() => {
        if (allSelected) {
            // 필터된 항목들만 선택 해제
            setSelectedIds(prev => {
                const newSelected = new Set(prev);
                filteredSubmitters.forEach(s => newSelected.delete(s.submitterId));
                return newSelected;
            });
        } else {
            // 필터된 항목들 선택 추가
            setSelectedIds(prev => {
                const newSelected = new Set(prev);
                filteredSubmitters.forEach(s => newSelected.add(s.submitterId));
                return newSelected;
            });
        }
    }, [allSelected, filteredSubmitters]);

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
            render: (submitter) => {
                // 제출됨/반려됨만 클릭 가능
                const canClick = hasEverSubmitted(submitter.status);
                if (canClick) {
                    return (
                        <button
                            onClick={() => handleNameClick(submitter.submitterId)}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
                        >
                            {submitter.name}
                        </button>
                    );
                }
                return <span className="text-sm text-gray-900">{submitter.name}</span>;
            },
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
            header: (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center gap-1 hover:text-gray-900 focus:outline-none">
                            제출상태
                            <ChevronDown className="w-3 h-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {statusFilterOptions.map((option) => (
                            <DropdownMenuItem
                                key={option.value}
                                onClick={() => setStatusFilter(option.value)}
                                className={statusFilter === option.value ? 'bg-gray-100' : ''}
                            >
                                {option.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            render: (submitter) => {
                // PENDING 상태: 정적 Badge로 표시
                if (submitter.status === 'PENDING') {
                    return (
                        <Badge className={SUBMITTER_STATUS_STYLES['PENDING']}>
                            {SUBMITTER_STATUS_LABELS['PENDING']}
                        </Badge>
                    );
                }
                return (
                    <SubmitterStatusDropdown
                        documentBoxId={documentBoxId}
                        submitterId={submitter.submitterId}
                        currentStatus={submitter.status as SubmittedSubmitterStatus}
                    />
                );
            },
        },
        {
            key: 'lastDate',
            header: '제출일',
            render: (submitter) => {
                const isLate = isLateSubmission(submitter.lastSubmittedAt, endDate);
                const resubmissionCount = submitter.resubmissionLogs.length;
                return (
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                        {formatSubmissionDate(submitter.lastSubmittedAt)}
                        {isLate && (
                            <ClockAlert className="w-3.5 h-3.5 text-orange-500" />
                        )}
                        {resubmissionCount > 0 && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                        <RotateCcw className="w-2.5 h-2.5 mr-0.5" />
                                        {resubmissionCount}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    재제출 {resubmissionCount}회
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </span>
                );
            },
        },
        {
            key: 'checked',
            header: '확인',
            render: (submitter) => {
                if (submitter.status === 'PENDING') return null;
                return (
                    <CheckedToggle
                        documentBoxId={documentBoxId}
                        submitterId={submitter.submitterId}
                        isChecked={submitter.isChecked}
                    />
                );
            },
        },
    ], [allSelected, selectedIds, documentBoxId, endDate, statusFilter, statusFilterOptions, handleSelectAll, handleSelectOne, handleNameClick]);

    const handleDownload = () => {
        const headers = ['이름', '이메일', '휴대전화', '제출상태', '제출일', '재제출횟수', '확인'];
        const rows = baseSubmitters.map(s => [
            s.name,
            s.email,
            s.phone || '',
            SUBMITTER_STATUS_LABELS[s.status as SubmitterStatus] || s.status,
            formatSubmissionDate(s.lastSubmittedAt),
            String(s.resubmissionLogs.length),
            s.isChecked ? 'O' : '',
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
                    {baseSubmitters.length > 0 && (
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
