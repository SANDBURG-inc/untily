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
import { Extension } from '@tiptap/core';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';

// ============================================================================
// CustomListKeymap 확장 - 노션 스타일 리스트 키보드 동작
// ============================================================================

/**
 * 리스트 항목에서의 백스페이스 동작을 노션 스타일로 개선합니다.
 *
 * @description
 * 기본 TipTap ListKeymap 확장(TipTap Issue #3128 "Bullet List Limbo")은
 * 빈 리스트 항목에서 백스페이스 시 이전 줄로 이동하면서 리스트를 유지합니다.
 * 이 커스텀 확장은 노션처럼 리스트에서 완전히 빠져나와 일반 단락으로 변환합니다.
 *
 * @behavior
 * - 리스트 항목 시작 위치에서 백스페이스 → 리스트에서 빠져나옴
 * - 빈 리스트 항목에서 백스페이스 → 리스트에서 빠져나옴
 * - 텍스트 중간에서 백스페이스 → 기본 동작 (문자 삭제)
 */
const CustomListKeymap = Extension.create({
    name: 'customListKeymap',

    addKeyboardShortcuts() {
        return {
            Backspace: ({ editor }) => {
                const { state } = editor;
                const { selection } = state;
                const { $from } = selection;

                // 현재 노드가 리스트 항목 내부의 paragraph인지 확인
                // 리스트 구조: bulletList/orderedList > listItem > paragraph
                const listItem = $from.node(-1);
                if (listItem?.type.name !== 'listItem') {
                    return false; // 리스트 항목이 아니면 기본 처리
                }

                // 커서가 리스트 항목(의 paragraph) 시작 위치인지 확인
                const isAtStart = $from.parentOffset === 0;

                // 리스트 항목(의 paragraph)이 비어있는지 확인
                const isEmpty = $from.parent.content.size === 0;

                // 시작 위치거나 비어있으면 리스트에서 빠져나옴
                if (isAtStart || isEmpty) {
                    return editor.commands.liftListItem('listItem');
                }

                return false; // 그 외에는 기본 백스페이스 동작
            },
        };
    },
});

// ============================================================================
// TextStyle 확장 - fontSize 속성 추가
// ============================================================================

/**
 * TextStyle을 확장하여 fontSize 속성을 지원합니다.
 *
 * @note
 * 기본 TipTap TextStyle은 span 태그의 기반만 제공하고,
 * fontSize 같은 실제 CSS 속성은 addAttributes()로 별도 정의해야 함.
 *
 * @relatedFiles
 * - components/email-editor/EmailEditorToolbar.tsx - FONT_SIZES 상수
 * - lib/tiptap/html-utils.ts - sanitizeHtmlForEmail()에서 인라인 스타일 처리
 */
const TextStyleExtended = TextStyle.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            fontSize: {
                default: null,
                // HTML 파싱 시 style 속성에서 font-size 추출
                parseHTML: element => element.style.fontSize?.replace(/['"]+/g, '') || null,
                // HTML 렌더링 시 style 속성에 font-size 추가
                renderHTML: attributes => {
                    if (!attributes.fontSize) return {};
                    return { style: `font-size: ${attributes.fontSize}` };
                },
            },
        };
    },
});

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
         *
         * heading은 H1~H4까지 지원 (Markdown 단축키: # + Space → H1)
         */
        StarterKit.configure({
            codeBlock: false,
            code: false,
            horizontalRule: false,
            heading: {
                levels: [1, 2, 3, 4],
            },
            // blockquote는 기본적으로 활성화됨
        }),

        /**
         * CustomListKeymap - 노션 스타일 리스트 키보드 동작
         *
         * @description
         * 기본 ListKeymap 확장의 "Bullet List Limbo" 문제(TipTap Issue #3128)를
         * 해결하기 위한 커스텀 확장입니다.
         *
         * @behavior
         * - 리스트 항목 시작에서 백스페이스 → 리스트에서 빠져나와 일반 단락으로
         * - 빈 리스트 항목에서 백스페이스 → 리스트 종료
         *
         * @see CustomListKeymap (이 파일 상단)
         */
        CustomListKeymap,

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
         * TextStyleExtended - 인라인 스타일 확장 (fontSize 속성 추가)
         *
         * @note
         * 기본 TextStyle을 확장하여 fontSize 속성을 지원.
         * Color, FontSize 등의 마크를 사용하려면 TextStyle이 필수.
         * span 태그에 style 속성을 추가하는 역할.
         *
         * @see TextStyleExtended (이 파일 상단)
         */
        TextStyleExtended,

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
