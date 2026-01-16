'use client';

/**
 * 이메일 템플릿 셀렉터
 *
 * 저장된 템플릿 목록을 드롭다운으로 표시하고 선택/저장 기능을 제공합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Save, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TemplateSaveDialog } from './TemplateSaveDialog';
import { DEFAULT_GREETING_HTML, DEFAULT_FOOTER_HTML } from '@/lib/email-templates';

// ============================================================================
// 타입 정의
// ============================================================================

interface Template {
    id: string;
    name: string;
    greetingHtml: string;
    footerHtml: string;
}

interface EmailTemplateSelectorProps {
    /** 템플릿 타입 (SEND or SHARE) */
    type: 'SEND' | 'SHARE';
    /** 현재 선택된 템플릿 ID (null이면 기본 템플릿) */
    selectedId: string | null;
    /** 현재 인사말 HTML (저장 시 사용) */
    currentGreetingHtml: string;
    /** 현재 아랫말 HTML (저장 시 사용) */
    currentFooterHtml: string;
    /** 템플릿 선택 핸들러 */
    onSelect: (template: Template | null) => void;
    /** 수정 여부 (저장 버튼 표시용) */
    hasChanges?: boolean;
}

// 기본 템플릿 객체
const DEFAULT_TEMPLATE: Template = {
    id: 'default',
    name: '기본',
    greetingHtml: DEFAULT_GREETING_HTML,
    footerHtml: DEFAULT_FOOTER_HTML,
};

export function EmailTemplateSelector({
    type,
    selectedId,
    currentGreetingHtml,
    currentFooterHtml,
    onSelect,
    hasChanges = false,
}: EmailTemplateSelectorProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    // 템플릿 목록 조회
    const fetchTemplates = useCallback(async () => {
        try {
            const res = await fetch(`/api/remind-template?type=${type}`);
            const data = await res.json();
            if (data.success && data.templates) {
                setTemplates(data.templates);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setIsLoading(false);
        }
    }, [type]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // 템플릿 삭제
    const handleDelete = async (templateId: string) => {
        if (!confirm('이 템플릿을 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/remind-template/${templateId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                // 목록 새로고침
                fetchTemplates();
                // 삭제된 템플릿이 현재 선택된 템플릿이면 기본으로 변경
                if (selectedId === templateId) {
                    onSelect(null);
                }
            }
        } catch (error) {
            console.error('Failed to delete template:', error);
        }
    };

    // 템플릿 저장 완료 핸들러
    const handleSaved = (savedTemplate: Template) => {
        fetchTemplates();
        onSelect(savedTemplate);
        setShowSaveDialog(false);
    };

    // 현재 선택된 템플릿 이름
    const selectedName =
        selectedId === null || selectedId === 'default'
            ? '기본'
            : templates.find((t) => t.id === selectedId)?.name || '기본';

    return (
        <>
            <div className="flex items-center gap-2">
                {/* 템플릿 드롭다운 */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <span className="max-w-[120px] truncate">
                                {isLoading ? '로딩...' : selectedName}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[180px]">
                        {/* 기본 템플릿 */}
                        <DropdownMenuItem
                            onClick={() => onSelect(null)}
                            className={
                                selectedId === null || selectedId === 'default'
                                    ? 'bg-blue-50'
                                    : ''
                            }
                        >
                            <span className="font-medium">기본</span>
                        </DropdownMenuItem>

                        {templates.length > 0 && <DropdownMenuSeparator />}

                        {/* 저장된 템플릿 목록 */}
                        {templates.map((template) => (
                            <DropdownMenuItem
                                key={template.id}
                                onClick={() => onSelect(template)}
                                className={`group justify-between ${
                                    selectedId === template.id ? 'bg-blue-50' : ''
                                }`}
                            >
                                <span className="truncate">{template.name}</span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(template.id);
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="템플릿 삭제"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* 저장 버튼 (수정 사항이 있을 때만 표시) */}
                {hasChanges && (
                    <button
                        type="button"
                        onClick={() => setShowSaveDialog(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        title="템플릿으로 저장"
                    >
                        <Save className="w-3.5 h-3.5" />
                        저장
                    </button>
                )}
            </div>

            {/* 템플릿 저장 다이얼로그 */}
            <TemplateSaveDialog
                open={showSaveDialog}
                onOpenChange={setShowSaveDialog}
                type={type}
                greetingHtml={currentGreetingHtml}
                footerHtml={currentFooterHtml}
                existingTemplateId={
                    selectedId !== 'default' ? selectedId : null
                }
                existingTemplateName={
                    selectedId && selectedId !== 'default'
                        ? templates.find((t) => t.id === selectedId)?.name
                        : undefined
                }
                onSaved={handleSaved}
            />
        </>
    );
}
