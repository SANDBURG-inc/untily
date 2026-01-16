'use client';

/**
 * 자동 리마인더용 템플릿 셀렉터
 *
 * AutoReminderSettings와 ReminderScheduleDialog에서 사용되는
 * 간단한 드롭다운 형태의 템플릿 선택 컴포넌트입니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================================================
// 타입 정의
// ============================================================================

interface Template {
    id: string;
    name: string;
    greetingHtml: string;
    footerHtml: string;
}

interface AutoReminderTemplateSelectorProps {
    /** 템플릿 타입 (SEND 고정) */
    type?: 'SEND' | 'SHARE';
    /** 현재 선택된 템플릿 ID */
    selectedId: string | null;
    /** 템플릿 선택 핸들러 */
    onSelect: (templateId: string | null) => void;
}

export function AutoReminderTemplateSelector({
    type = 'SEND',
    selectedId,
    onSelect,
}: AutoReminderTemplateSelectorProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    // 현재 선택된 템플릿 이름
    const selectedName =
        selectedId === null || selectedId === 'default'
            ? '기본 템플릿'
            : templates.find((t) => t.id === selectedId)?.name || '기본 템플릿';

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">이메일 템플릿</label>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <span className="truncate">
                            {isLoading ? '로딩...' : selectedName}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-500 ml-2 shrink-0" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-full min-w-[200px]">
                    {/* 기본 템플릿 */}
                    <DropdownMenuItem
                        onClick={() => onSelect(null)}
                        className={
                            selectedId === null || selectedId === 'default'
                                ? 'bg-blue-50'
                                : ''
                        }
                    >
                        <span className="font-medium">기본 템플릿</span>
                    </DropdownMenuItem>

                    {templates.length > 0 && <DropdownMenuSeparator />}

                    {/* 저장된 템플릿 목록 */}
                    {templates.map((template) => (
                        <DropdownMenuItem
                            key={template.id}
                            onClick={() => onSelect(template.id)}
                            className={selectedId === template.id ? 'bg-blue-50' : ''}
                        >
                            <span className="truncate">{template.name}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-xs text-gray-500">
                리마인드 이메일에 사용할 템플릿을 선택하세요.
            </p>
        </div>
    );
}
