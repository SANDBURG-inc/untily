'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendManualReminder } from "@/app/dashboard/[id]/actions";
import { generateReminderEmailHtml } from '@/lib/email-templates';
import { PageHeader } from "@/components/shared/PageHeader";
import { Checkbox } from "@/components/ui/checkbox";

interface Submitter {
    submitterId: string;
    name: string;
    email: string;
    submittedDocuments: any[];
}

interface RequiredDocument {
    id: string; // Using string as Prisma cuid
    name: string;
    description: string | null;
    isRequired: boolean;
}

interface Props {
    documentBoxId: string;
    documentBoxTitle: string;
    endDate: Date;
    submitters: Submitter[];
    requiredDocuments: RequiredDocument[];
}

export function ReminderSendForm({ documentBoxId, documentBoxTitle, endDate, submitters, requiredDocuments }: Props) {
    const router = useRouter();

    // Initial state: Select only unsubmitted users
    const unsubmittedIds = submitters
        .filter(s => s.submittedDocuments.length === 0)
        .map(s => s.submitterId);

    const [selectedIds, setSelectedIds] = useState<string[]>(unsubmittedIds);
    const [isPending, setIsPending] = useState(false);

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const isAllUnsubmittedSelected = unsubmittedIds.length > 0 && unsubmittedIds.every(id => selectedIds.includes(id));

    const toggleAllUnsubmitted = () => {
        if (isAllUnsubmittedSelected) {
            // Deselect all (only unsubmitted ones, to preserve manual choices if needed? Simplest is just toggle unsubmitted group)
            // Let's just deselect the unsubmitted ones from the current selection
            setSelectedIds(selectedIds.filter(id => !unsubmittedIds.includes(id)));
        } else {
            // Select all unsubmitted
            const newIds = new Set(selectedIds);
            unsubmittedIds.forEach(id => newIds.add(id));
            setSelectedIds(Array.from(newIds));
        }
    };

    const handleSend = async () => {
        if (selectedIds.length === 0) {
            alert("수신자를 한 명 이상 선택해주세요.");
            return;
        }
        if (!confirm(`${selectedIds.length}명에게 리마인드 이메일을 발송하시겠습니까?`)) return;

        setIsPending(true);
        const result = await sendManualReminder(documentBoxId, selectedIds);
        setIsPending(false);

        if (result.success) {
            router.push(`/dashboard/${documentBoxId}/send/success`);
            router.refresh();
        } else {
            alert("발송 실패: " + result.error);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <PageHeader
                title="서류 제출 요청하기"
                description="수신자에게 서류 제출 요청 이메일을 발송합니다."
                align="center"
            />

            {/* Recipient List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <span className="text-lg">👥</span> 수신자 목록(총 {submitters.length}명)
                    </h3>
                    <button
                        onClick={toggleAllUnsubmitted}
                        className={`text-xs px-3 py-1.5 rounded border transition-colors ${isAllUnsubmittedSelected
                            ? 'bg-blue-50 text-blue-600 border-blue-200 font-medium'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        미제출자 전체선택
                    </button>
                </div>
                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                    {submitters.map(submitter => {
                        const isSubmitted = submitter.submittedDocuments.length > 0;
                        const isSelected = selectedIds.includes(submitter.submitterId);

                        return (
                            <div key={submitter.submitterId} className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}>
                                <div className="flex items-center gap-4 flex-1">
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleSelect(submitter.submitterId)}
                                    />
                                    <div className="grid grid-cols-2 gap-4 flex-1">
                                        <span className="text-sm font-medium text-gray-900">{submitter.name}</span>
                                        <span className="text-sm text-gray-500">{submitter.email}</span>
                                    </div>
                                </div>
                                <div className="w-20 text-right">
                                    <span className={`text-xs font-medium ${isSubmitted ? 'text-green-600' : 'text-red-500'}`}>
                                        {isSubmitted ? '제출완료' : '미제출'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Email Preview */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-lg">✉️</span> 이메일 미리보기
                </h3>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                        <div className="text-sm text-gray-500 mb-1">제목</div>
                        <div className="text-base font-bold text-gray-900">[문서 제출 요청] {documentBoxTitle} 서류 제출</div>
                    </div>
                    {/* Render HTML Preview in a safe container, or just styled div to look like email client */}
                    <div className="p-6 bg-white overflow-x-auto">
                        <div
                            dangerouslySetInnerHTML={{
                                __html: generateReminderEmailHtml({
                                    documentBoxTitle,
                                    documentBoxDescription: "필수 서류를 제출해주세요.", // Or pass actual description if available
                                    endDate,
                                    requiredDocuments: requiredDocuments.map(d => ({
                                        name: d.name,
                                        description: d.description,
                                        isRequired: d.isRequired
                                    })),
                                    submissionLink: "(제출자별 링크가 생성됩니다)"
                                })
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Required Documents List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-lg">📄</span> 요청 서류(총 {requiredDocuments.length}개)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiredDocuments.map(doc => (
                        <div key={doc.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between hover:border-blue-200 transition-colors">
                            <div>
                                <h4 className="font-medium text-gray-900 text-sm">{doc.name}</h4>
                                {doc.description && <p className="text-xs text-gray-500 mt-1">{doc.description}</p>}
                            </div>
                            {doc.isRequired && (
                                <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full">필수서류</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 py-3 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isPending || selectedIds.length === 0}
                        className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        {isPending ? '발송 중...' : '보내기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
