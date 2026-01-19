/**
 * ============================================================================
 * TipTap 에디터 확장 설정
 * ============================================================================
 *
 * @description
 * 이메일 템플릿 편집에 필요한 TipTap 확장들을 설정합니다.
 * 이메일 클라이언트 호환성을 위해 일부 기능은 비활성화되어 있습니다.
 *
 * @features
 * - StarterKit: 기본 편집 기능 (Bold, Italic, BulletList, OrderedList, Blockquote 등)
 * - TextAlign: 텍스트 정렬 (왼쪽, 가운데, 오른쪽, 양쪽)
 * - Link: 하이퍼링크
 * - Highlight: 형광펜 (멀티컬러 지원)
 * - Placeholder: 빈 에디터에 표시되는 안내 텍스트
 *
 * @relatedFiles
 * - components/email-editor/EmailEditor.tsx - 이 확장들을 사용하는 에디터
 * - components/email-editor/EmailEditorToolbar.tsx - 확장 기능을 제어하는 툴바
 * - lib/tiptap/html-utils.ts - HTML 변환 및 이메일 인라인 스타일
 *
 * @packages
 * - @tiptap/starter-kit: 기본 확장 번들
 * - @tiptap/extension-placeholder: 플레이스홀더
 * - @tiptap/extension-text-align: 텍스트 정렬
 * - @tiptap/extension-link: 링크
 * - @tiptap/extension-highlight: 형광펜
 */

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle, Color } from '@tiptap/extension-text-style';

// ============================================================================
// 확장 설정
// ============================================================================

/**
 * 이메일 에디터용 TipTap 확장 배열을 반환합니다.
 *
 * @param placeholderText - 에디터가 비어있을 때 표시할 텍스트
 * @returns TipTap 확장 배열
 *
 * @example
 * const editor = useEditor({
 *     extensions: getEmailEditorExtensions('내용을 입력하세요...'),
 *     content: '<p>Hello</p>',
 * });
 */
export function getEmailEditorExtensions(placeholderText?: string) {
    return [
        /**
         * StarterKit - TipTap 기본 확장 번들
         *
         * 포함된 기능: Bold, Italic, Strike, Code, BulletList, OrderedList,
         * Blockquote, CodeBlock, HardBreak, Heading, HorizontalRule, etc.
         *
         * @note
         * 이메일 클라이언트 호환성을 위해 일부 기능 비활성화:
         * - codeBlock: 이메일에서 코드 블록 스타일 지원이 불안정
         * - code: 인라인 코드도 마찬가지
         * - horizontalRule: 이메일에서 HR 렌더링이 다양함
         * - heading: 이메일에서 h1-h6 사용 자제 (스타일 충돌)
         */
        StarterKit.configure({
            codeBlock: false,
            code: false,
            horizontalRule: false,
            heading: false,
            // blockquote는 기본적으로 활성화됨
        }),

        /**
         * TextAlign - 텍스트 정렬 확장
         *
         * @note
         * 이메일에서 text-align은 대부분의 클라이언트에서 잘 지원됨.
         * types 배열에 정렬을 적용할 노드 타입을 지정.
         */
        TextAlign.configure({
            types: ['paragraph', 'listItem'],
        }),

        /**
         * Link - 하이퍼링크 확장
         *
         * @note
         * openOnClick: false - 에디터에서 링크 클릭 시 이동 방지
         * target: '_blank' - 새 탭에서 열기 (이메일 표준)
         * rel: 'noopener noreferrer' - 보안 속성
         */
        Link.configure({
            openOnClick: false,
            HTMLAttributes: {
                target: '_blank',
                rel: 'noopener noreferrer',
            },
        }),

        /**
         * Highlight - 형광펜(하이라이트) 확장
         *
         * @note
         * multicolor: true - 여러 색상 지원
         * 색상은 data-color 속성으로 저장됨.
         *
         * @relatedFiles
         * - EmailEditorToolbar.tsx의 HIGHLIGHT_COLORS 상수
         * - html-utils.ts의 sanitizeHtmlForEmail()에서 인라인 스타일로 변환
         *
         * @knownIssues
         * 하이라이트 적용 후 storedMarks에 저장되어 isActive가 계속 true 반환
         * → EmailEditorToolbar.tsx의 applyHighlight()에서 storedMarks 초기화로 해결
         */
        Highlight.configure({
            multicolor: true,
        }),

        /**
         * TextStyle - 인라인 스타일 확장 (Color, FontSize 등의 기반)
         *
         * @note
         * Color, FontSize 등의 마크를 사용하려면 TextStyle이 필수.
         * span 태그에 style 속성을 추가하는 역할.
         */
        TextStyle,

        /**
         * Color - 텍스트 색상 확장
         *
         * @note
         * TextStyle 확장이 필요함.
         * <span style="color: #색상코드">텍스트</span> 형식으로 HTML 생성.
         *
         * @relatedFiles
         * - html-utils.ts의 sanitizeHtmlForEmail()에서 인라인 스타일 처리
         */
        Color,

        /**
         * Placeholder - 플레이스홀더 확장
         *
         * @note
         * 에디터가 비어있을 때 안내 텍스트 표시.
         * CSS는 EmailEditor.tsx의 .is-editor-empty::before에서 정의.
         */
        Placeholder.configure({
            placeholder: placeholderText || '내용을 입력하세요...',
            emptyEditorClass: 'is-editor-empty',
        }),
    ];
}

// ============================================================================
// 기본 템플릿 상수
// ============================================================================

/**
 * 기본 인사말 (TipTap JSON 형식)
 *
 * @note
 * TipTap 에디터의 content prop에 직접 전달 가능.
 * {제출자_이름}은 이메일 발송 시 실제 이름으로 치환됨.
 */
export const DEFAULT_GREETING_JSON = {
    type: 'doc',
    content: [
        {
            type: 'paragraph',
            content: [
                { type: 'text', text: '안녕하세요 {제출자_이름}님,' },
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
 *
 * @note
 * HTML 형식으로 저장된 템플릿과의 호환성을 위해 제공.
 * 새로운 템플릿은 TipTap JSON 형식 사용 권장.
 */
export const DEFAULT_GREETING_HTML =
    '안녕하세요 {제출자_이름}님,<br/>아래 문서 제출을 요청드립니다. 마감일까지 제출 부탁드립니다.';

/**
 * 기본 아랫말 HTML
 */
export const DEFAULT_FOOTER_HTML =
    '위 링크를 통해 문서를 제출해주시기 바랍니다.<br/>감사합니다.';
