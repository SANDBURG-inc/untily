'use client';

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { generateReminderEmailHtml } from '@/lib/email-templates';
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { ShareEmailPreviewEditable } from "@/components/email-editor/ShareEmailPreviewEditable";

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

    // 이메일 템플릿 상태
    const templateRef = useRef<{ greetingHtml: string; footerHtml: string }>({
        greetingHtml: '',
        footerHtml: '',
    });

    const handleTemplateChange = (greetingHtml: string, footerHtml: string) => {
        templateRef.current = { greetingHtml, footerHtml };
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    const handleCopyEmail = async (customGreetingHtml?: string, customFooterHtml?: string) => {
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
                submissionLink: shareLink,
                customGreetingHtml: customGreetingHtml || undefined,
                customFooterHtml: customFooterHtml || undefined,
            });

            const plainText = `[리마인드] ${documentBoxTitle} 서류 제출\n\n${documentBoxDescription || '아래 문서 제출을 요청드립니다.'}\n\n마감일: ${new Date(endDate).toISOString().split('T')[0]}\n\n제출 링크: ${shareLink}`;

            // HTML과 텍스트 형식의 Blob 생성
            const htmlBlob = new Blob([emailHtml], { type: 'text/html' });
            const textBlob = new Blob([plainText], { type: 'text/plain' });

            // Clipboard API로 두 형식 모두 복사
            await navigator.clipboard.write([
                new ClipboardItem({
                    ['text/html']: htmlBlob,
                    ['text/plain']: textBlob,
                })
            ]);

            setCopiedEmail(true);
            setTimeout(() => setCopiedEmail(false), 2000);

            // 마지막 사용 템플릿 저장
            if (customGreetingHtml || customFooterHtml) {
                try {
                    await fetch('/api/remind-template/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            documentBoxId,
                            lastGreetingHtml: customGreetingHtml || null,
                            lastFooterHtml: customFooterHtml || null,
                        }),
                    });
                } catch (saveErr) {
                    console.error('Failed to save template config:', saveErr);
                }
            }
        } catch (err) {
            console.error('Failed to copy email:', err);
            // ClipboardItem 미지원 시 텍스트만 복사 (폴백)
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

            {/* 이메일 미리보기 (편집 가능) */}
            <ShareEmailPreviewEditable
                documentBoxId={documentBoxId}
                documentBoxTitle={documentBoxTitle}
                documentBoxDescription={documentBoxDescription}
                endDate={endDate}
                requiredDocuments={requiredDocuments}
                shareLink={shareLink}
                onTemplateChange={handleTemplateChange}
                onCopyEmail={handleCopyEmail}
                copiedEmail={copiedEmail}
                onCopyLink={handleCopyLink}
                copiedLink={copiedLink}
            />

            {/* 요청 서류 섹션 */}
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

            {/* 하단 버튼 */}
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
