'use client';

import { useState, useMemo } from 'react';
import { Users, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { downloadCsv } from '@/lib/utils/csv-export';
import type { SubmitterWithStatus } from '@/lib/queries/document-box';

/**
 * 제출자 목록 컴포넌트
 * 체크박스 선택, CSV 다운로드, 접기/펼치기 기능 제공
 */
interface SubmittersListProps {
    /** 제출자 목록 (제출 상태 포함) */
    submitters: SubmitterWithStatus[];
    /** 문서함 제목 (CSV 파일명에 사용) */
    documentBoxTitle: string;
    /** 필수 서류 총 개수 */
    totalRequiredDocuments: number;
}

type SubmissionStatus = '제출완료' | '미제출' | '부분제출';

/** 제출 상태 계산 */
function getSubmissionStatus(submittedCount: number, totalRequired: number): SubmissionStatus {
    if (totalRequired === 0) return '제출완료';
    if (submittedCount === 0) return '미제출';
    if (submittedCount >= totalRequired) return '제출완료';
    return '부분제출';
}

/** 상태별 스타일 */
function getStatusStyle(status: SubmissionStatus): string {
    switch (status) {
        case '제출완료':
            return 'bg-green-100 text-green-700';
        case '미제출':
            return 'bg-gray-100 text-gray-700';
        case '부분제출':
            return 'bg-yellow-100 text-yellow-700';
    }
}

const INITIAL_DISPLAY_COUNT = 5;

export function SubmittersList({
    submitters,
    documentBoxTitle,
    totalRequiredDocuments,
}: SubmittersListProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showAll, setShowAll] = useState(false);

    const displayedSubmitters = useMemo(() => {
        return showAll ? submitters : submitters.slice(0, INITIAL_DISPLAY_COUNT);
    }, [submitters, showAll]);

    const allSelected = useMemo(() => {
        return submitters.length > 0 && selectedIds.size === submitters.length;
    }, [submitters.length, selectedIds.size]);

    const handleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(submitters.map(s => s.submitterId)));
        }
    };

    const handleSelectOne = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleDownload = () => {
        const headers = ['이름', '이메일', '휴대전화', '제출상태', '제출일', '진행상황'];
        const rows = submitters.map(s => {
            const status = getSubmissionStatus(s.submittedCount, totalRequiredDocuments);
            const progress = totalRequiredDocuments > 0
                ? `${s.submittedCount}/${totalRequiredDocuments} (${Math.round((s.submittedCount / totalRequiredDocuments) * 100)}%)`
                : '-';
            const lastDate = s.lastSubmittedAt
                ? s.lastSubmittedAt.toISOString().split('T')[0]
                : '-';

            return [s.name, s.email, s.phone || '', status, lastDate, progress];
        });

        downloadCsv({
            filename: `${documentBoxTitle}_제출자목록.csv`,
            headers,
            rows,
        });
    };

    return (
        <Card className="mb-6 py-0 gap-0 border border-gray-200 shadow-none">
            <CardHeader className="px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                    <Users className="w-6 h-6 text-gray-700" />
                    제출자 목록
                </CardTitle>
                <CardAction className="flex items-center gap-2">
                    {submitters.length > INITIAL_DISPLAY_COUNT && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            {showAll ? '접기' : '모두보기'}
                        </button>
                    )}
                    <Button variant="secondary" size="sm" onClick={handleDownload}>
                        <Download className="w-4 h-4" />
                        다운로드
                    </Button>
                </CardAction>
            </CardHeader>

            <CardContent className="px-6 py-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                                    <input
                                        type="checkbox"
                                        className="rounded"
                                        checked={allSelected}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">이름</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">이메일</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">제출상태</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">제출일</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">진행상황</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedSubmitters.map((submitter) => {
                                const status = getSubmissionStatus(submitter.submittedCount, totalRequiredDocuments);
                                const progress = totalRequiredDocuments > 0
                                    ? `${submitter.submittedCount}/${totalRequiredDocuments} (${Math.round((submitter.submittedCount / totalRequiredDocuments) * 100)}%)`
                                    : '-';
                                const lastDate = submitter.lastSubmittedAt
                                    ? submitter.lastSubmittedAt.toISOString().split('T')[0]
                                    : '-';

                                return (
                                    <tr key={submitter.submitterId} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <input
                                                type="checkbox"
                                                className="rounded"
                                                checked={selectedIds.has(submitter.submitterId)}
                                                onChange={() => handleSelectOne(submitter.submitterId)}
                                            />
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-900">{submitter.name}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{submitter.email}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusStyle(status)}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{lastDate}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{progress}</td>
                                        <td className="py-3 px-4 text-sm text-gray-400">...</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
