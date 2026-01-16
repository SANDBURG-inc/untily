'use client';

/**
 * 편집 가능한 이메일 미리보기 컴포넌트
 *
 * SendForm에서 사용되며, 인사말/아랫말 편집 기능을 제공합니다.
 * 수정 아이콘을 클릭하면 편집 모드로 전환됩니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { SquarePen, X, Check } from 'lucide-react';
import { EmailEditor } from './EmailEditor';
import { EmailTemplateSelector } from './EmailTemplateSelector';
import { highlightPlaceholders } from './PlaceholderTag';
import {
    generateDocumentInfoHtml,
    DEFAULT_GREETING_HTML,
    DEFAULT_FOOTER_HTML,
} from '@/lib/email-templates';

// ============================================================================
// 타입 정의
// ============================================================================

interface Template {
    id: string;
    name: string;
    greetingHtml: string;
    footerHtml: string;
}

interface EmailPreviewEditableProps {
    /** 문서함 ID */
    documentBoxId: string;
    /** 문서함 제목 */
    documentBoxTitle: string;
    /** 문서함 설명 */
    documentBoxDescription?: string | null;
    /** 마감일 */
    endDate: Date;
    /** 필수 서류 목록 */
    requiredDocuments: {
        name: string;
        description: string | null;
        isRequired: boolean;
    }[];
    /** 제출 링크 */
    submissionLink: string;
    /** 템플릿 타입 */
    type: 'SEND' | 'SHARE';
    /** 템플릿 변경 핸들러 */
    onTemplateChange: (greetingHtml: string, footerHtml: string) => void;
}

export function EmailPreviewEditable({
    documentBoxId,
    documentBoxTitle,
    documentBoxDescription,
    endDate,
    requiredDocuments,
    submissionLink,
    type,
    onTemplateChange,
}: EmailPreviewEditableProps) {
    // 상태 관리
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [greetingHtml, setGreetingHtml] = useState(DEFAULT_GREETING_HTML);
    const [footerHtml, setFooterHtml] = useState(DEFAULT_FOOTER_HTML);
    const [originalGreeting, setOriginalGreeting] = useState(DEFAULT_GREETING_HTML);
    const [originalFooter, setOriginalFooter] = useState(DEFAULT_FOOTER_HTML);

    // 수정 여부 확인
    const hasChanges =
        greetingHtml !== DEFAULT_GREETING_HTML ||
        footerHtml !== DEFAULT_FOOTER_HTML;

    // 문서함 정보 HTML (자동 생성, 편집 불가)
    const documentInfoHtml = generateDocumentInfoHtml({
        documentBoxTitle,
        documentBoxDescription,
        endDate,
        requiredDocuments,
        submissionLink,
    });

    // 마지막 사용 템플릿 로드
    const loadLastUsedTemplate = useCallback(async () => {
        try {
            const res = await fetch(
                `/api/remind-template/config?documentBoxId=${documentBoxId}&type=${type}`
            );
            const data = await res.json();

            if (data.success && data.config) {
                const { lastGreetingHtml, lastFooterHtml, lastTemplateId } = data.config;
                if (lastGreetingHtml && lastFooterHtml) {
                    setGreetingHtml(lastGreetingHtml);
                    setFooterHtml(lastFooterHtml);
                    setOriginalGreeting(lastGreetingHtml);
                    setOriginalFooter(lastFooterHtml);
                    setSelectedTemplateId(lastTemplateId);
                    onTemplateChange(lastGreetingHtml, lastFooterHtml);
                }
            }
        } catch (error) {
            console.error('Failed to load last used template:', error);
        }
    }, [documentBoxId, type, onTemplateChange]);

    useEffect(() => {
        loadLastUsedTemplate();
    }, [loadLastUsedTemplate]);

    // 템플릿 선택 핸들러
    const handleTemplateSelect = (template: Template | null) => {
        if (template) {
            setSelectedTemplateId(template.id);
            setGreetingHtml(template.greetingHtml);
            setFooterHtml(template.footerHtml);
            onTemplateChange(template.greetingHtml, template.footerHtml);
        } else {
            // 기본 템플릿 선택
            setSelectedTemplateId(null);
            setGreetingHtml(DEFAULT_GREETING_HTML);
            setFooterHtml(DEFAULT_FOOTER_HTML);
            onTemplateChange(DEFAULT_GREETING_HTML, DEFAULT_FOOTER_HTML);
        }
    };

    // 편집 모드 진입
    const enterEditMode = () => {
        setOriginalGreeting(greetingHtml);
        setOriginalFooter(footerHtml);
        setIsEditing(true);
    };

    // 편집 취소
    const cancelEdit = () => {
        setGreetingHtml(originalGreeting);
        setFooterHtml(originalFooter);
        setIsEditing(false);
    };

    // 편집 완료
    const completeEdit = () => {
        onTemplateChange(greetingHtml, footerHtml);
        setIsEditing(false);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="text-lg">✉️</span> 이메일 미리보기
                </h3>
                <div className="flex items-center gap-2">
                    {/* 템플릿 셀렉터 */}
                    {!isEditing && (
                        <EmailTemplateSelector
                            type={type}
                            selectedId={selectedTemplateId}
                            currentGreetingHtml={greetingHtml}
                            currentFooterHtml={footerHtml}
                            onSelect={handleTemplateSelect}
                            hasChanges={hasChanges}
                        />
                    )}

                    {/* 수정/완료 버튼 */}
                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={enterEditMode}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="이메일 내용 수정"
                        >
                            <SquarePen className="w-4 h-4" />
                            수정
                        </button>
                    ) : (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={completeEdit}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Check className="w-4 h-4" />
                                완료
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 이메일 미리보기 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* 제목 */}
                <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">제목</div>
                    <div className="text-base font-bold text-gray-900">
                        [문서 제출 요청] {documentBoxTitle} 서류 제출
                    </div>
                </div>

                {/* 본문 */}
                <div className="p-6 bg-white">
                    {/* 인사말 (편집 가능) */}
                    <div
                        className={
                            isEditing
                                ? 'border-2 border-blue-300 rounded-lg p-3 mb-4 bg-blue-50/30'
                                : 'mb-4'
                        }
                    >
                        {isEditing ? (
                            <div>
                                <div className="text-xs font-medium text-blue-600 mb-2">
                                    인사말 (편집 가능)
                                </div>
                                <EmailEditor
                                    content={greetingHtml}
                                    onChange={setGreetingHtml}
                                    placeholder="인사말을 입력하세요..."
                                />
                            </div>
                        ) : (
                            <div
                                className="text-sm text-gray-700"
                                dangerouslySetInnerHTML={{
                                    __html: highlightPlaceholders(greetingHtml),
                                }}
                            />
                        )}
                    </div>

                    {/* 본문 - 문서함 정보 (편집 불가) */}
                    <div
                        className={isEditing ? 'opacity-60' : ''}
                        dangerouslySetInnerHTML={{ __html: documentInfoHtml }}
                    />

                    {/* 아랫말 (편집 가능) */}
                    <div
                        className={
                            isEditing
                                ? 'border-2 border-blue-300 rounded-lg p-3 mt-4 bg-blue-50/30'
                                : 'mt-4'
                        }
                    >
                        {isEditing ? (
                            <div>
                                <div className="text-xs font-medium text-blue-600 mb-2">
                                    아랫말 (편집 가능)
                                </div>
                                <EmailEditor
                                    content={footerHtml}
                                    onChange={setFooterHtml}
                                    placeholder="아랫말을 입력하세요..."
                                />
                            </div>
                        ) : (
                            <div
                                className="text-xs text-gray-500"
                                dangerouslySetInnerHTML={{
                                    __html: footerHtml,
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
