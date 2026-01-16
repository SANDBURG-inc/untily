/**
 * TipTap 에디터 확장 설정
 *
 * 이메일 템플릿 편집에 필요한 기본 확장들을 설정합니다.
 */

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

/**
 * 이메일 에디터용 기본 확장 설정
 */
export function getEmailEditorExtensions(placeholderText?: string) {
    return [
        StarterKit.configure({
            // 이메일에서 지원하지 않는 기능 비활성화
            codeBlock: false,
            code: false,
            blockquote: false,
            horizontalRule: false,
            heading: false,
        }),
        Placeholder.configure({
            placeholder: placeholderText || '내용을 입력하세요...',
            emptyEditorClass: 'is-editor-empty',
        }),
    ];
}

/**
 * 기본 인사말 (TipTap JSON 형식)
 */
export const DEFAULT_GREETING_JSON = {
    type: 'doc',
    content: [
        {
            type: 'paragraph',
            content: [
                { type: 'text', text: '안녕하세요 {제출자}님,' },
            ],
        },
        {
            type: 'paragraph',
            content: [
                { type: 'text', text: '아래 문서 제출을 요청드립니다. 마감일까지 제출 부탁드립니다.' },
            ],
        },
    ],
};

/**
 * 기본 아랫말 (TipTap JSON 형식)
 */
export const DEFAULT_FOOTER_JSON = {
    type: 'doc',
    content: [
        {
            type: 'paragraph',
            content: [
                { type: 'text', text: '위 링크를 통해 문서를 제출해주시기 바랍니다.' },
            ],
        },
        {
            type: 'paragraph',
            content: [
                { type: 'text', text: '감사합니다.' },
            ],
        },
    ],
};

/**
 * 기본 인사말 HTML
 */
export const DEFAULT_GREETING_HTML =
    '안녕하세요 {제출자}님,<br/>아래 문서 제출을 요청드립니다. 마감일까지 제출 부탁드립니다.';

/**
 * 기본 아랫말 HTML
 */
export const DEFAULT_FOOTER_HTML =
    '위 링크를 통해 문서를 제출해주시기 바랍니다.<br/>감사합니다.';
