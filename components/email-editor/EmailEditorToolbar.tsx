'use client';

/**
 * 이메일 에디터 툴바
 *
 * Bold, Italic, 플레이스홀더 삽입 등의 편집 도구를 제공합니다.
 */

import type { Editor } from '@tiptap/react';
import { Bold, Italic, List, ListOrdered, User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PLACEHOLDERS } from '@/lib/tiptap/html-utils';
import { cn } from '@/lib/utils';

interface EmailEditorToolbarProps {
    editor: Editor;
}

export function EmailEditorToolbar({ editor }: EmailEditorToolbarProps) {
    // 플레이스홀더 삽입
    const insertPlaceholder = (placeholder: string) => {
        editor.chain().focus().insertContent(placeholder).run();
    };

    return (
        <div className="flex items-center gap-1 mb-2 p-1 bg-gray-50 border border-gray-200 rounded-lg">
            {/* Bold */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="굵게 (Ctrl+B)"
            >
                <Bold className="w-4 h-4" />
            </ToolbarButton>

            {/* Italic */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="기울임 (Ctrl+I)"
            >
                <Italic className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-5 bg-gray-300 mx-1" />

            {/* Bullet List */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="글머리 기호 목록"
            >
                <List className="w-4 h-4" />
            </ToolbarButton>

            {/* Ordered List */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="번호 매기기 목록"
            >
                <ListOrdered className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-5 bg-gray-300 mx-1" />

            {/* 플레이스홀더 삽입 */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded transition-colors"
                        title="변수 삽입"
                    >
                        <User className="w-3.5 h-3.5" />
                        <span>변수</span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[140px]">
                    {PLACEHOLDERS.map((item) => (
                        <DropdownMenuItem
                            key={item.id}
                            onClick={() => insertPlaceholder(item.placeholder)}
                        >
                            <span className="font-mono text-blue-600 mr-2">
                                {item.placeholder}
                            </span>
                            <span className="text-gray-500">{item.label}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

// 툴바 버튼 컴포넌트
interface ToolbarButtonProps {
    onClick: () => void;
    isActive?: boolean;
    title?: string;
    children: React.ReactNode;
}

function ToolbarButton({
    onClick,
    isActive,
    title,
    children,
}: ToolbarButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={cn(
                'p-1.5 rounded transition-colors',
                isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-200'
            )}
        >
            {children}
        </button>
    );
}
