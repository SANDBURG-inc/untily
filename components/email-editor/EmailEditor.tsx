'use client';

/**
 * TipTap 기반 이메일 에디터
 *
 * 이메일 템플릿의 인사말/아랫말을 편집하는 WYSIWYG 에디터입니다.
 */

import { useEditor, EditorContent } from '@tiptap/react';
import { getEmailEditorExtensions } from '@/lib/tiptap/extensions';
import { EmailEditorToolbar } from './EmailEditorToolbar';

interface EmailEditorProps {
    /** 에디터 내용 (HTML) */
    content: string;
    /** 내용 변경 핸들러 */
    onChange: (html: string) => void;
    /** 플레이스홀더 텍스트 */
    placeholder?: string;
    /** 읽기 전용 모드 */
    readOnly?: boolean;
    /** 최소 높이 */
    minHeight?: string;
}

export function EmailEditor({
    content,
    onChange,
    placeholder = '내용을 입력하세요...',
    readOnly = false,
    minHeight = '80px',
}: EmailEditorProps) {
    const editor = useEditor({
        extensions: getEmailEditorExtensions(placeholder),
        content,
        editable: !readOnly,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none',
                style: `min-height: ${minHeight}`,
            },
        },
    });

    if (!editor) {
        return (
            <div
                className="animate-pulse bg-gray-100 rounded"
                style={{ minHeight }}
            />
        );
    }

    return (
        <div className="email-editor">
            {!readOnly && <EmailEditorToolbar editor={editor} />}
            <div
                className={`border rounded-lg p-3 ${
                    readOnly
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'
                }`}
            >
                <EditorContent editor={editor} />
            </div>

            {/* TipTap 에디터 스타일 */}
            <style jsx global>{`
                .email-editor .ProseMirror {
                    outline: none;
                }
                .email-editor .ProseMirror p {
                    margin: 0 0 8px 0;
                }
                .email-editor .ProseMirror p:last-child {
                    margin-bottom: 0;
                }
                .email-editor .ProseMirror.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #9ca3af;
                    pointer-events: none;
                    height: 0;
                }
            `}</style>
        </div>
    );
}
