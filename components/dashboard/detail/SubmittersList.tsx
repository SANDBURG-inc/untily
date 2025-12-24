'use client';

import { useState, useMemo, useCallback } from 'react';
import { Users, Download, FileArchive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
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
}

const INITIAL_DISPLAY_COUNT = 5;

export function SubmittersList({
    submitters,
    documentBoxId,
    documentBoxTitle,
    totalRequiredDocuments,
}: SubmittersListProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showAll, setShowAll] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [isDownloadingFiles, setIsDownloadingFiles] = useState(false);

    // 필터링된 제출자 목록
    const filteredSubmitters = useMemo(() => {
        if (statusFilter === 'all') return submitters;
        return submitters.filter(s => {
            const status = getSubmissionStatus(s.submittedCount, totalRequiredDocuments);
            return status === statusFilter;
        });
    }, [submitters, statusFilter, totalRequiredDocuments]);

    const displayedSubmitters = useMemo(() => {
        return showAll ? filteredSubmitters : filteredSubmitters.slice(0, INITIAL_DISPLAY_COUNT);
    }, [filteredSubmitters, showAll]);

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
                <span className="text-sm text-gray-900">{submitter.name}</span>
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
            render: (submitter) => (
                <span className="text-sm text-gray-600">
                    {formatSubmissionDate(submitter.lastSubmittedAt)}
                </span>
            ),
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
    ], [allSelected, selectedIds, totalRequiredDocuments, handleSelectAll, handleSelectOne]);

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
            const response = await fetch(`/api/document-box/${documentBoxId}/files`);

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || '파일 다운로드에 실패했습니다.');
                return;
            }

            // Blob으로 변환 후 다운로드
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${documentBoxTitle}_제출파일.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('File download error:', error);
            alert('파일 다운로드 중 오류가 발생했습니다.');
        } finally {
            setIsDownloadingFiles(false);
        }
    };

    return (
        <Card variant="compact" className="mb-6">
            <CardHeader variant="compact">
                <CardTitle>
                    <SectionHeader icon={Users} title="제출자 목록" />
                </CardTitle>
                <CardAction className="flex items-center gap-2">
                    {filteredSubmitters.length > INITIAL_DISPLAY_COUNT && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            {showAll ? '접기' : '모두보기'}
                        </button>
                    )}
                    <IconButton
                        variant="secondary"
                        size="sm"
                        icon={<Download className="w-4 h-4" />}
                        onClick={handleDownload}
                    >
                        제출현황
                    </IconButton>
                    <IconButton
                        variant="primary"
                        size="sm"
                        icon={<FileArchive className="w-4 h-4" />}
                        onClick={handleFilesDownload}
                        disabled={isDownloadingFiles}
                    >
                        {isDownloadingFiles ? '다운로드 중...' : '파일 다운로드'}
                    </IconButton>
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
                <Table
                    columns={columns}
                    data={displayedSubmitters}
                    keyExtractor={(s) => s.submitterId}
                />
            </CardContent>
        </Card>
    );
}
