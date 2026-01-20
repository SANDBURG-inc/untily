'use client';

/**
 * ============================================================================
 * SendForm용 편집 가능한 이메일 미리보기 컴포넌트
 * ============================================================================
 *
 * @description
 * SendForm(문서 제출 요청 발송 페이지)에서 사용되는 이메일 미리보기입니다.
 * 인사말/아랫말 편집 기능과 템플릿 선택 기능을 제공합니다.
 *
 * @features
 * - 이메일 미리보기 표시
 * - 인사말/아랫말 편집 (EmailEditor 사용)
 * - 템플릿 선택/저장 (EmailTemplateSelector 사용)
 * - 마지막 사용 템플릿 자동 로드
 *
 * @relatedFiles
 * - EmailEditor.tsx - 실제 편집에 사용되는 TipTap 에디터
 * - EmailEditorToolbar.tsx - 에디터 툴바
 * - EmailTemplateSelector.tsx - 템플릿 선택/저장 UI
 * - ShareEmailPreviewEditable.tsx - ShareForm용 미리보기 (유사한 구조)
 * - PlaceholderTag.tsx - 변수 하이라이트 표시
 *
 * @knownIssues
 * - 편집 모드가 아닐 때 스타일이 표시되지 않는 문제
 *   → email-preview-content 클래스와 CSS로 해결
 */

import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
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
    /** 템플릿 변경 핸들러 */
    onTemplateChange: (greetingHtml: string, footerHtml: string) => void;
}

/** ref를 통해 노출되는 메서드 */
export interface EmailPreviewEditableRef {
    /** 현재 편집 중인지 여부 */
    isEditing: boolean;
    /** 편집 버튼 영역으로 스크롤 및 포커스 */
    scrollToEditButtons: () => void;
}

export const EmailPreviewEditable = forwardRef<EmailPreviewEditableRef, EmailPreviewEditableProps>(function EmailPreviewEditable({
    documentBoxTitle,
    documentBoxDescription,
    endDate,
    requiredDocuments,
    submissionLink,
    onTemplateChange,
}, ref) {
    // 상태 관리
    const [isEditing, setIsEditing] = useState(false);
    const editButtonsRef = useRef<HTMLDivElement>(null);

    // ref를 통해 외부에서 접근 가능한 메서드 노출
    useImperativeHandle(ref, () => ({
        isEditing,
        scrollToEditButtons: () => {
            editButtonsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // 취소/완료 버튼 중 첫 번째 버튼에 포커스
            const firstButton = editButtonsRef.current?.querySelector('button');
            setTimeout(() => firstButton?.focus(), 300);
        },
    }), [isEditing]);
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
            const res = await fetch('/api/remind-template/config');
            const data = await res.json();

            if (data.success && data.lastTemplate) {
                const { lastGreetingHtml, lastFooterHtml, lastTemplateId } = data.lastTemplate;
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
    }, [onTemplateChange]);

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
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="text-lg">✉️</span> 이메일 미리보기
                </h3>
                <div className="flex items-center gap-2">
                    {/* 템플릿 셀렉터 */}
                    {!isEditing && (
                        <EmailTemplateSelector
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
                        <div ref={editButtonsRef} className="flex items-center gap-1">
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
            <p className="text-xs text-gray-500 mb-4">
                마지막으로 편집한 템플릿이 모든 문서함에 자동으로 적용됩니다.
            </p>

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
                    <div className="mb-4">
                        {isEditing ? (
                            <EmailEditor
                                content={greetingHtml}
                                onChange={setGreetingHtml}
                                placeholder="인사말을 입력하세요..."
                            />
                        ) : (
                            <div
                                className="text-sm text-gray-700 email-preview-content"
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
                    <div className="mt-4">
                        {isEditing ? (
                            <EmailEditor
                                content={footerHtml}
                                onChange={setFooterHtml}
                                placeholder="아랫말을 입력하세요..."
                            />
                        ) : (
                            <div
                                className="text-xs text-gray-500 email-preview-content"
                                dangerouslySetInnerHTML={{
                                    __html: highlightPlaceholders(footerHtml),
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/*
             * ================================================================
             * 미리보기용 CSS 스타일
             * ================================================================
             *
             * @problem
             * 편집 모드가 아닐 때(dangerouslySetInnerHTML로 렌더링)
             * 불렛/숫자/링크/하이라이트가 표시되지 않음.
             *
             * @solution
             * email-preview-content 클래스에 필요한 스타일 정의.
             * EmailEditor.tsx의 .email-editor .ProseMirror 스타일과 동일하게 유지.
             *
             * @relatedFiles
             * - EmailEditor.tsx의 <style jsx global> 섹션
             * - ShareEmailPreviewEditable.tsx의 동일한 스타일
             * - lib/tiptap/html-utils.ts의 sanitizeHtmlForEmail()
             */}
            <style jsx global>{`
                /* 불렛 리스트 */
                .email-preview-content ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin: 0 0 8px 0;
                }
                /* 순서 리스트 */
                .email-preview-content ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin: 0 0 8px 0;
                }
                .email-preview-content li {
                    margin-bottom: 4px;
                }
                .email-preview-content li p {
                    margin: 0;
                }
                /* 링크 */
                .email-preview-content a {
                    color: #2563eb;
                    text-decoration: underline;
                }
                .email-preview-content a:hover {
                    color: #1d4ed8;
                }
                /* 형광펜 (하이라이트) */
                .email-preview-content mark {
                    background-color: #fef08a;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.125rem;
                }
                /* 인용 */
                .email-preview-content blockquote {
                    border-left: 3px solid #d1d5db;
                    padding-left: 1rem;
                    margin: 0 0 8px 0;
                    color: #6b7280;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
});
