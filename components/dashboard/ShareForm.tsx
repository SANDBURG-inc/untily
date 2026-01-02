'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";
import { generateReminderEmailHtml } from '@/lib/email-templates';
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";

interface RequiredDocument {
    id: string;
    name: string;
    description: string | null;
    isRequired: boolean;
}

interface Props {
    documentBoxId: string;
    documentBoxTitle: string;
    documentBoxDescription: string | null;
    endDate: Date;
    requiredDocuments: RequiredDocument[];
}

export function ShareForm({
    documentBoxId,
    documentBoxTitle,
    documentBoxDescription,
    endDate,
    requiredDocuments
}: Props) {
    const router = useRouter();
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(false);

    const shareLink = `https://untily.kr/submit/${documentBoxId}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    const handleCopyEmail = async () => {
        try {
            const emailHtml = generateReminderEmailHtml({
                documentBoxTitle,
                documentBoxDescription: documentBoxDescription || "필수 서류를 제출해주세요.",
                endDate,
                requiredDocuments: requiredDocuments.map(d => ({
                    name: d.name,
                    description: d.description,
                    isRequired: d.isRequired
                })),
                submissionLink: shareLink
            });

            const plainText = `[리마인드] ${documentBoxTitle} 서류 제출\n\n${documentBoxDescription || '아래 문서 제출을 요청드립니다.'}\n\n마감일: ${new Date(endDate).toISOString().split('T')[0]}\n\n제출 링크: ${shareLink}`;

            // Create blobs for both HTML and plain text
            const htmlBlob = new Blob([emailHtml], { type: 'text/html' });
            const textBlob = new Blob([plainText], { type: 'text/plain' });

            // Use the Clipboard API to write both formats
            await navigator.clipboard.write([
                new ClipboardItem({
                    ['text/html']: htmlBlob,
                    ['text/plain']: textBlob,
                })
            ]);

            setCopiedEmail(true);
            setTimeout(() => setCopiedEmail(false), 2000);
        } catch (err) {
            console.error('Failed to copy email:', err);
            // Fallback to plain text if ClipboardItem is not supported
            try {
                const plainText = `[리마인드] ${documentBoxTitle} 서류 제출\n\n${documentBoxDescription || '아래 문서 제출을 요청드립니다.'}\n\n마감일: ${new Date(endDate).toISOString().split('T')[0]}\n\n제출 링크: ${shareLink}`;
                await navigator.clipboard.writeText(plainText);
                setCopiedEmail(true);
                setTimeout(() => setCopiedEmail(false), 2000);
            } catch (fallbackErr) {
                console.error('Fallback copy failed:', fallbackErr);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <PageHeader
                title="서류 제출 요청하기"
                description="링크를 복사해, 제출자에게 서류 제출 요청을 보내보세요."
                align="center"
            />

            {/* Email Preview Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <span className="text-lg">✉️</span> 이메일 미리보기
                    </h3>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-6 relative">
                    <button
                        onClick={handleCopyEmail}
                        className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        {copiedEmail ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        메일복사
                    </button>

                    <div className="space-y-4 max-w-2xl">
                        <div>
                            <h4 className="text-lg font-bold text-slate-900 mb-1">{documentBoxTitle}</h4>
                            <p className="text-sm text-slate-500">{documentBoxDescription || "연말정산을 위한 필수 서류를 제출해주세요."}</p>
                        </div>

                        <div className="text-sm text-slate-700 space-y-2">
                            <p>📅 <strong>마감일:</strong> {new Date(endDate).toISOString().split('T')[0]}</p>
                            <div>
                                <p className="mb-1 font-semibold">📄 제출 서류:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    {requiredDocuments.map(doc => (
                                        <li key={doc.id}>
                                            {doc.name}
                                            {doc.isRequired && (
                                                <span className="text-red-500 ml-1 font-bold">*</span>
                                            )}
                                            {doc.description && <span className="text-slate-400 ml-2">: {doc.description}</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-white border border-slate-100 rounded-lg flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">제출 링크</p>
                                <p className="text-blue-600 text-sm font-medium truncate underline">
                                    {shareLink}
                                </p>
                            </div>
                            <button
                                onClick={handleCopyLink}
                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                {copiedLink ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                링크복사
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Requested Documents Section */}
            <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-lg">📄</span> 요청 서류(총 {requiredDocuments.length}개)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiredDocuments.map(doc => (
                        <div key={doc.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between hover:border-blue-200 transition-colors shadow-sm">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-bold text-slate-900">{doc.name}</h4>
                                {doc.isRequired && (
                                    <Badge variant="warning" className="text-[10px] px-1.5 py-0">필수서류</Badge>
                                )}
                            </div>
                            {doc.description && <p className="text-sm text-slate-500">{doc.description}</p>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex-1 py-3.5 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                    취소
                </button>
                <button
                    onClick={() => router.push(`/dashboard/${documentBoxId}`)}
                    className="flex-1 py-3.5 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                    확인
                </button>
            </div>
        </div>
    );
}
