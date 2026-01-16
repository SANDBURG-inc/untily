'use client';

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendManualReminder, sendReminderAfterDeadline } from "@/app/dashboard/[id]/actions";
import { PageHeader } from "@/components/shared/PageHeader";
import { Checkbox } from "@/components/ui/checkbox";
import type { DocumentBoxStatus } from "@/lib/types/document";
import { DocumentBoxStatusChangeDialog } from "@/components/shared/DocumentBoxStatusChangeDialog";
import { EmailPreviewEditable } from "@/components/email-editor/EmailPreviewEditable";

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
    documentBoxDescription?: string | null;
    endDate: Date;
    /** 문서함 상태 */
    documentBoxStatus: DocumentBoxStatus;
    submitters: Submitter[];
    requiredDocuments: RequiredDocument[];
}

export function ReminderSendForm({ documentBoxId, documentBoxTitle, documentBoxDescription, endDate, documentBoxStatus, submitters, requiredDocuments }: Props) {
    const router = useRouter();

    // Initial state: Select only unsubmitted users
    const unsubmittedIds = submitters
        .filter(s => s.submittedDocuments.length === 0)
        .map(s => s.submitterId);

    const [selectedIds, setSelectedIds] = useState<string[]>(unsubmittedIds);
    const [isPending, setIsPending] = useState(false);

    // 마감 후 발송 확인 Dialog 상태
    const [showAfterDeadlineDialog, setShowAfterDeadlineDialog] = useState(false);

    // 이메일 템플릿 상태
    const templateRef = useRef<{ greetingHtml: string; footerHtml: string }>({
        greetingHtml: '',
        footerHtml: '',
    });

    const handleTemplateChange = (greetingHtml: string, footerHtml: string) => {
        templateRef.current = { greetingHtml, footerHtml };
    };

    // 열린 상태가 아닌지 확인 (OPEN, OPEN_RESUME, OPEN_SOMEONE는 열린 상태)
    // OPEN_RESUME: 모든 사용자가 제출 가능한 상태이므로 Dialog 불필요
    // OPEN_SOMEONE: 이미 일부 제출 가능 상태이므로 상태 변경 안내 불필요
    const isNotOpenStatus = documentBoxStatus !== 'OPEN' && documentBoxStatus !== 'OPEN_RESUME' && documentBoxStatus !== 'OPEN_SOMEONE';

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

        // OPEN 상태가 아니면 확인 Dialog 표시
        if (isNotOpenStatus) {
            setShowAfterDeadlineDialog(true);
            return;
        }

        // 일반 발송
        if (!confirm(`${selectedIds.length}명에게 리마인드 이메일을 발송하시겠습니까?`)) return;

        setIsPending(true);
        const { greetingHtml, footerHtml } = templateRef.current;
        const result = await sendManualReminder(
            documentBoxId,
            selectedIds,
            greetingHtml || undefined,
            footerHtml || undefined
        );
        setIsPending(false);

        if (result.success) {
            router.push(`/dashboard/${documentBoxId}/send/success`);
            router.refresh();
        } else {
            alert("발송 실패: " + result.error);
        }
    };

    // 마감 후 발송 확인
    const handleAfterDeadlineSend = async () => {
        setShowAfterDeadlineDialog(false);
        setIsPending(true);

        const { greetingHtml, footerHtml } = templateRef.current;
        const result = await sendReminderAfterDeadline(
            documentBoxId,
            selectedIds,
            greetingHtml || undefined,
            footerHtml || undefined
        );
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

            {/* Email Preview - Editable */}
            <EmailPreviewEditable
                documentBoxId={documentBoxId}
                documentBoxTitle={documentBoxTitle}
                documentBoxDescription={documentBoxDescription}
                endDate={endDate}
                requiredDocuments={requiredDocuments.map(d => ({
                    name: d.name,
                    description: d.description,
                    isRequired: d.isRequired
                }))}
                submissionLink="(제출자별 링크가 생성됩니다)"
                type="SEND"
                onTemplateChange={handleTemplateChange}
            />

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

            {/* 마감 후 발송 확인 Dialog */}
            <DocumentBoxStatusChangeDialog
                open={showAfterDeadlineDialog}
                onOpenChange={setShowAfterDeadlineDialog}
                title="마감 후 리마인드 발송"
                currentStatus={documentBoxStatus}
                newStatus="일부 제출 가능"
                newStatusColor="orange"
                description={
                    <p>
                        리마인드를 발송하면 <strong>이번에 리마인드를 받은 사람만</strong>{' '}
                        서류를 제출할 수 있습니다.
                    </p>
                }
                confirmText="동의하고 발송"
                onConfirm={handleAfterDeadlineSend}
                onCancel={() => setShowAfterDeadlineDialog(false)}
            />
        </div>
    );
}
