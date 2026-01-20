'use client';

/**
 * ============================================================================
 * SendForm용 편집 가능한 이메일 미리보기 컴포넌트
 * ============================================================================
 *
 * @description
 * SendForm(문서 제출 요청 발송 페이지)에서 사용되는 이메일 미리보기입니다.
 * 인사말/아랫말 편집 기능과 템플릿 선택/저장 기능을 제공합니다.
 *
 * @features
 * - 이메일 미리보기 표시
 * - 인사말/아랫말 편집 (EmailEditor 사용)
 * - 템플릿 선택 (EmailTemplateSelector 사용)
 * - 완료 버튼 클릭 시 변경사항 있으면 TemplateSaveDialog 표시
 * - 저장된 템플릿이 문서함별로 유지됨
 * - 자동 리마인더도 저장된 템플릿 사용
 *
 * @relatedFiles
 * - EmailEditor.tsx - 실제 편집에 사용되는 TipTap 에디터
 * - EmailTemplateSelector.tsx - 템플릿 선택 UI
 * - TemplateSaveDialog.tsx - 템플릿 저장 다이얼로그
 * - PlaceholderTag.tsx - 변수 하이라이트 표시
 */

import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { SquarePen, X, Check } from 'lucide-react';
import { EmailEditor } from './EmailEditor';
import { EmailTemplateSelector } from './EmailTemplateSelector';
import { TemplateSaveDialog } from './TemplateSaveDialog';
import { highlightPlaceholders } from './PlaceholderTag';
import { Skeleton } from '@/components/ui/skeleton';
import {
    generateDocumentInfoHtml,
    DEFAULT_GREETING_HTML,
    DEFAULT_FOOTER_HTML,
} from '@/lib/email-templates';

// ============================================================================
// 타입 정의
// ============================================================================

export interface Template {
    id: string;
    name: string;
    greetingHtml: string;
    footerHtml: string;
}

interface EmailPreviewEditableProps {
    /** 문서함 ID (템플릿 설정 저장용) */
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
    documentBoxId,
    documentBoxTitle,
    documentBoxDescription,
    endDate,
    requiredDocuments,
    submissionLink,
    onTemplateChange,
}, ref) {
    // 상태 관리
    const [isEditing, setIsEditing] = useState(false);
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
    const editButtonsRef = useRef<HTMLDivElement>(null);

    // ref를 통해 외부에서 접근 가능한 메서드 노출
    useImperativeHandle(ref, () => ({
        isEditing,
        scrollToEditButtons: () => {
            editButtonsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const firstButton = editButtonsRef.current?.querySelector('button');
            setTimeout(() => firstButton?.focus(), 300);
        },
    }), [isEditing]);

    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [selectedTemplateName, setSelectedTemplateName] = useState<string | undefined>(undefined);
    const [greetingHtml, setGreetingHtml] = useState(DEFAULT_GREETING_HTML);
    const [footerHtml, setFooterHtml] = useState(DEFAULT_FOOTER_HTML);
    const [originalGreeting, setOriginalGreeting] = useState(DEFAULT_GREETING_HTML);
    const [originalFooter, setOriginalFooter] = useState(DEFAULT_FOOTER_HTML);

    // 템플릿 목록 상태 (병렬 로딩을 위해 부모에서 관리)
    const [templates, setTemplates] = useState<Template[]>([]);

    // 저장 다이얼로그 상태
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    // 수정 여부 확인 (기본 템플릿과 비교)
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

    // 문서함의 마지막 사용 템플릿과 템플릿 목록을 병렬 로드
    const loadTemplateData = useCallback(async () => {
        setIsLoadingTemplate(true);
        try {
            // 두 API를 병렬로 호출
            const [configRes, templatesRes] = await Promise.all([
                fetch(`/api/remind-template/config?documentBoxId=${documentBoxId}`),
                fetch('/api/remind-template'),
            ]);

            const [configData, templatesData] = await Promise.all([
                configRes.json(),
                templatesRes.json(),
            ]);

            // 템플릿 목록 설정
            if (templatesData.success && templatesData.templates) {
                setTemplates(templatesData.templates);
            }

            // 마지막 사용 템플릿 설정
            if (configData.success && configData.lastTemplate) {
                const { lastGreetingHtml, lastFooterHtml, lastTemplateId, lastTemplateName } = configData.lastTemplate;
                if (lastGreetingHtml && lastFooterHtml) {
                    setGreetingHtml(lastGreetingHtml);
                    setFooterHtml(lastFooterHtml);
                    setOriginalGreeting(lastGreetingHtml);
                    setOriginalFooter(lastFooterHtml);
                    setSelectedTemplateId(lastTemplateId);
                    setSelectedTemplateName(lastTemplateName || undefined);
                    onTemplateChange(lastGreetingHtml, lastFooterHtml);
                }
            }
        } catch (error) {
            console.error('Failed to load template data:', error);
        } finally {
            setIsLoadingTemplate(false);
        }
    }, [documentBoxId, onTemplateChange]);

    useEffect(() => {
        loadTemplateData();
    }, [loadTemplateData]);

    // 템플릿 선택 핸들러
    const handleTemplateSelect = (template: Template | null) => {
        if (template) {
            setSelectedTemplateId(template.id);
            setSelectedTemplateName(template.name);
            setGreetingHtml(template.greetingHtml);
            setFooterHtml(template.footerHtml);
            onTemplateChange(template.greetingHtml, template.footerHtml);
        } else {
            // 기본 템플릿 선택
            setSelectedTemplateId(null);
            setSelectedTemplateName(undefined);
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

    // 편집 완료 - 변경사항 있으면 저장 다이얼로그, 없으면 바로 완료
    const completeEdit = () => {
        onTemplateChange(greetingHtml, footerHtml);

        // 변경사항이 있으면 저장 다이얼로그 표시
        if (greetingHtml !== originalGreeting || footerHtml !== originalFooter) {
            setShowSaveDialog(true);
        } else {
            setIsEditing(false);
        }
    };

    // 템플릿 저장 완료 핸들러
    const handleTemplateSaved = async (savedTemplate: Template) => {
        setSelectedTemplateId(savedTemplate.id);
        setSelectedTemplateName(savedTemplate.name);
        setShowSaveDialog(false);
        setIsEditing(false);

        // 템플릿 목록 업데이트 (새 템플릿이면 추가, 기존이면 교체)
        setTemplates((prev) => {
            const exists = prev.some((t) => t.id === savedTemplate.id);
            if (exists) {
                return prev.map((t) => (t.id === savedTemplate.id ? savedTemplate : t));
            }
            return [...prev, savedTemplate];
        });

        // 문서함 템플릿 설정 저장 (마지막 사용 템플릿으로 설정)
        try {
            await fetch('/api/remind-template/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentBoxId,
                    lastTemplateId: savedTemplate.id,
                    lastGreetingHtml: savedTemplate.greetingHtml,
                    lastFooterHtml: savedTemplate.footerHtml,
                }),
            });
        } catch (error) {
            console.error('Failed to save template config:', error);
        }
    };

    // 저장 없이 완료 (다이얼로그에서 취소)
    const handleSaveDialogClose = (open: boolean) => {
        setShowSaveDialog(open);
        if (!open) {
            // 다이얼로그 닫히면 편집 모드도 종료
            setIsEditing(false);
        }
    };

    // 로딩 중 Skeleton UI
    if (isLoadingTemplate) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
                {/* 헤더 Skeleton */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-6 h-6 rounded" />
                        <Skeleton className="w-28 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-20 h-8 rounded-lg" />
                        <Skeleton className="w-16 h-8 rounded-lg" />
                    </div>
                </div>
                <Skeleton className="w-64 h-4 mb-4" />

                {/* 이메일 미리보기 Skeleton */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* 제목 Skeleton */}
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                        <Skeleton className="w-10 h-4 mb-2" />
                        <Skeleton className="w-48 h-5" />
                    </div>

                    {/* 본문 Skeleton */}
                    <div className="p-6 bg-white space-y-4">
                        {/* 인사말 */}
                        <div className="space-y-2">
                            <Skeleton className="w-full h-4" />
                            <Skeleton className="w-3/4 h-4" />
                        </div>

                        {/* 문서함 정보 */}
                        <div className="space-y-3 py-4">
                            <Skeleton className="w-32 h-5" />
                            <Skeleton className="w-full h-4" />
                            <Skeleton className="w-2/3 h-4" />
                            <Skeleton className="w-24 h-8 rounded mt-2" />
                        </div>

                        {/* 아랫말 */}
                        <div className="space-y-2">
                            <Skeleton className="w-full h-3" />
                            <Skeleton className="w-1/2 h-3" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                            selectedName={selectedTemplateName}
                            onSelect={handleTemplateSelect}
                            templates={templates}
                            onTemplatesChange={setTemplates}
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
                저장된 템플릿은 이 문서함의 자동 리마인더에도 적용됩니다.
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

            {/* 템플릿 저장 다이얼로그 */}
            <TemplateSaveDialog
                open={showSaveDialog}
                onOpenChange={handleSaveDialogClose}
                greetingHtml={greetingHtml}
                footerHtml={footerHtml}
                existingTemplateId={selectedTemplateId !== 'default' ? selectedTemplateId : null}
                existingTemplateName={selectedTemplateName}
                onSaved={handleTemplateSaved}
            />

            {/*
             * ================================================================
             * 미리보기용 CSS 스타일
             * ================================================================
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
