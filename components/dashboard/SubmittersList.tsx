'use client';

import { useState, useMemo } from 'react';
import { Users, Download } from 'lucide-react';

interface Submitter {
    submitterId: string;
    name: string;
    email: string;
    phone: string | null;
}

interface SubmittersListProps {
    submitters: Submitter[];
    documentBoxTitle: string;
}

export function SubmittersList({ submitters, documentBoxTitle }: SubmittersListProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showAll, setShowAll] = useState(false);

    const INITIAL_DISPLAY_COUNT = 5;

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

    const handleDownload = async () => {
        try {
            // Convert submitters to CSV format
            const headers = ['이름', '이메일', '휴대전화', '제출상태'];
            const rows = submitters.map(s => [
                s.name,
                s.email,
                s.phone || '',
                '제출완료' // TODO: 실제 제출 상태로 변경
            ]);

            // Add BOM for proper Korean encoding in Excel
            const BOM = '\uFEFF';
            const csvContent = BOM + [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${documentBoxTitle}_제출자목록.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('다운로드 실패:', error);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-700" />
                    <h2 className="text-base font-semibold text-gray-900">제출자 목록</h2>
                </div>
                <div className="flex items-center gap-2">
                    {submitters.length > INITIAL_DISPLAY_COUNT && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            {showAll ? '접기' : '모두보기'}
                        </button>
                    )}
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-[#E2E8F0] rounded-md hover:bg-gray-50 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        다운로드
                    </button>
                </div>
            </div>

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
                        {displayedSubmitters.map((submitter) => (
                            <tr key={submitter.submitterId} className="border-b border-gray-100 hover:bg-gray-50">
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
                                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                                        제출완료
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">2024-11-15</td>
                                <td className="py-3 px-4 text-sm text-gray-600">0/0 (0%)</td>
                                <td className="py-3 px-4 text-sm text-gray-400">...</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
