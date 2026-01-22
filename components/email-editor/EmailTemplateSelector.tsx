'use client';

/**
 * 이메일 템플릿 셀렉터
 *
 * 저장된 템플릿 목록을 드롭다운으로 표시하고 선택 기능을 제공합니다.
 * 저장 기능은 EmailPreviewEditable에서 완료 버튼과 함께 처리됩니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    /** 현재 선택된 템플릿 ID (null이면 기본 템플릿) */
    selectedId: string | null;
    /** 현재 선택된 템플릿 이름 (부모에서 전달, 동기화용) */
    selectedName?: string;
    /** 템플릿 선택 핸들러 */
    onSelect: (template: Template | null) => void;
    /** 템플릿 목록 새로고침 트리거 */
    refreshTrigger?: number;
    /** 부모 컴포넌트의 로딩 상태 */
    parentLoading?: boolean;
    /** 외부에서 전달된 템플릿 목록 (전달 시 자체 fetch 안함) */
    templates?: Template[];
    /** 템플릿 목록 변경 핸들러 (삭제 시 부모에 알림) */
    onTemplatesChange?: (templates: Template[]) => void;
}

// 기본 템플릿 객체
const DEFAULT_TEMPLATE: Template = {
    id: 'default',
    name: '기본',
    greetingHtml: DEFAULT_GREETING_HTML,
    footerHtml: DEFAULT_FOOTER_HTML,
};

export function EmailTemplateSelector({
    selectedId,
    selectedName: selectedNameProp,
    onSelect,
    refreshTrigger = 0,
    parentLoading = false,
    templates: externalTemplates,
    onTemplatesChange,
}: EmailTemplateSelectorProps) {
    const [internalTemplates, setInternalTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(!externalTemplates);

    // 외부 템플릿이 있으면 사용, 없으면 내부 상태 사용
    const templates = externalTemplates ?? internalTemplates;

    // 템플릿 목록 조회 (외부 템플릿이 없을 때만)
    const fetchTemplates = useCallback(async () => {
        if (externalTemplates) return; // 외부에서 전달받으면 fetch 안함

        try {
            const res = await fetch('/api/remind-template');
            const data = await res.json();
            if (data.success && data.templates) {
                setInternalTemplates(data.templates);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setIsLoading(false);
        }
    }, [externalTemplates]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates, refreshTrigger]);

    // 템플릿 삭제
    const handleDelete = async (templateId: string) => {
        if (!confirm('이 템플릿을 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/remind-template/${templateId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                // 외부 템플릿 사용 시 부모에 알림, 아니면 자체 새로고침
                if (externalTemplates && onTemplatesChange) {
                    const updated = templates.filter((t) => t.id !== templateId);
                    onTemplatesChange(updated);
                } else {
                    fetchTemplates();
                }
                // 삭제된 템플릿이 현재 선택된 템플릿이면 기본으로 변경
                if (selectedId === templateId) {
                    onSelect(null);
                }
            }
        } catch (error) {
            console.error('Failed to delete template:', error);
        }
    };

    // 현재 선택된 템플릿 이름
    // 부모에서 전달받은 이름이 있으면 우선 사용 (동기화)
    const selectedName =
        selectedId === null || selectedId === 'default'
            ? '기본'
            : selectedNameProp || templates.find((t) => t.id === selectedId)?.name || '기본';

    // 전체 로딩 상태 (부모 로딩 또는 자체 로딩)
    const showLoading = parentLoading || isLoading;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <span className="max-w-[120px] truncate">
                        {showLoading ? '로딩...' : selectedName}
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
    );
}
