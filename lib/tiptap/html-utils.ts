/**
 * ============================================================================
 * TipTap HTML 유틸리티
 * ============================================================================
 *
 * @description
 * TipTap JSON과 HTML 간의 변환, 플레이스홀더 처리, 이메일 인라인 스타일 변환 등
 * 이메일 템플릿 처리에 필요한 유틸리티 함수들을 제공합니다.
 *
 * @features
 * - TipTap JSON ↔ HTML 변환
 * - 플레이스홀더 변수 치환 ({제출자_이름} → 실제 이름)
 * - 이메일 발송용 인라인 스타일 변환
 *
 * @relatedFiles
 * - lib/tiptap/extensions.ts - TipTap 확장 설정
 * - components/email-editor/EmailEditor.tsx - 에디터 컴포넌트
 * - components/email-editor/EmailEditorToolbar.tsx - 툴바 (HIGHLIGHT_COLORS)
 * - components/email-editor/PlaceholderTag.tsx - 변수 하이라이트 UI
 *
 * @knownIssues
 * - 멀티컬러 하이라이트의 data-color 속성을 인라인 스타일로 변환 필요
 *   → sanitizeHtmlForEmail()에서 처리
 */

import { generateHTML, generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';

// ============================================================================
// TipTap HTML 변환용 확장 (최소 구성)
// ============================================================================

/**
 * HTML 변환에 사용되는 TipTap 확장 목록
 *
 * @note
 * generateHTML/generateJSON에는 기본 StarterKit만 필요.
 * Highlight, Link 등은 HTML 변환 시 자동으로 처리됨.
 */
const extensions = [StarterKit];

// ============================================================================
// JSON ↔ HTML 변환 함수
// ============================================================================

/**
 * TipTap JSON을 HTML 문자열로 변환합니다.
 *
 * @param json - TipTap 에디터의 JSON 콘텐츠 또는 JSON 문자열
 * @returns HTML 문자열 (변환 실패 시 빈 문자열)
 *
 * @example
 * const html = tiptapJsonToHtml({
 *     type: 'doc',
 *     content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }]
 * });
 * // => '<p>Hello</p>'
 */
export function tiptapJsonToHtml(json: unknown): string {
    try {
        if (typeof json === 'string') {
            json = JSON.parse(json);
        }
        return generateHTML(json as Parameters<typeof generateHTML>[0], extensions);
    } catch {
        return '';
    }
}

/**
 * HTML 문자열을 TipTap JSON으로 변환합니다.
 *
 * @param html - HTML 문자열
 * @returns TipTap JSON 객체 (변환 실패 시 빈 문서 반환)
 *
 * @example
 * const json = htmlToTiptapJson('<p>Hello</p>');
 * // => { type: 'doc', content: [{ type: 'paragraph', ... }] }
 */
export function htmlToTiptapJson(html: string): unknown {
    try {
        return generateJSON(html, extensions);
    } catch {
        return { type: 'doc', content: [{ type: 'paragraph' }] };
    }
}

// ============================================================================
// 플레이스홀더(변수) 처리
// ============================================================================

/**
 * 플레이스홀더 변수 목록
 *
 * @note
 * 이 목록은 EmailEditorToolbar.tsx의 "변수" 드롭다운에서 사용됨.
 * 새 변수 추가 시 replacePlaceholders() 함수도 함께 수정 필요.
 *
 * @relatedFiles
 * - components/email-editor/EmailEditorToolbar.tsx - 변수 삽입 UI
 * - components/email-editor/PlaceholderTag.tsx - 변수 하이라이트 표시
 */
export const PLACEHOLDERS = [
    { id: 'submitter', label: '제출자 이름', placeholder: '{제출자_이름}' },
] as const;

/**
 * HTML 내의 플레이스홀더 변수를 실제 값으로 치환합니다.
 *
 * @param html - 플레이스홀더가 포함된 HTML 문자열
 * @param variables - 치환할 변수 값 객체
 * @returns 치환된 HTML 문자열
 *
 * @example
 * replacePlaceholders('안녕하세요 {제출자_이름}님', { submitterName: '홍길동' });
 * // => '안녕하세요 홍길동님'
 *
 * @note
 * {제출자} 패턴도 하위 호환성을 위해 지원 (이전 버전 템플릿)
 */
export function replacePlaceholders(
    html: string,
    variables: { submitterName?: string }
): string {
    let result = html;

    // {제출자_이름} -> 이름으로 치환 (이름이 없으면 빈 문자열)
    result = result.replace(/\{제출자_이름\}/g, variables.submitterName || '');

    // {제출자} -> 이름으로 치환 (하위 호환성)
    result = result.replace(/\{제출자\}/g, variables.submitterName || '');

    // {제출자님} -> 이름님으로 치환 (이름이 없으면 '님' 제거)
    result = result.replace(
        /\{제출자님\}/g,
        variables.submitterName ? `${variables.submitterName}님` : ''
    );

    return result;
}

// ============================================================================
// 이메일 발송용 HTML 변환
// ============================================================================

/**
 * HTML을 이메일 클라이언트 호환 형식으로 변환합니다.
 *
 * @description
 * 이메일 클라이언트는 CSS 클래스를 지원하지 않는 경우가 많으므로,
 * 모든 스타일을 인라인 스타일로 변환합니다.
 *
 * @param html - TipTap 에디터에서 생성된 HTML
 * @returns 인라인 스타일이 적용된 이메일 호환 HTML
 *
 * @note
 * 이 함수에서 처리하는 태그들:
 * - p: 기본 단락 스타일
 * - strong: 굵은 글씨
 * - em: 기울임
 * - ul/ol/li: 리스트
 * - blockquote: 인용
 * - mark: 형광펜 (멀티컬러 지원)
 * - a: 링크
 *
 * @relatedFiles
 * - components/email-editor/EmailEditor.tsx - 에디터 CSS 스타일과 일치해야 함
 * - components/email-editor/EmailEditorToolbar.tsx - HIGHLIGHT_COLORS와 호환
 *
 * @important
 * 새로운 서식 추가 시 이 함수도 함께 수정해야 이메일에서 정상 표시됨!
 */
export function sanitizeHtmlForEmail(html: string): string {
    return html
        // 빈 줄 처리: <p></p> 또는 <p><br></p>를 &nbsp;로 채워서 높이 유지
        // 이메일 클라이언트는 빈 p 태그를 무시하므로 반드시 필요
        .replace(/<p><\/p>/g, '<p>&nbsp;</p>')
        .replace(/<p><br\s*\/?><\/p>/g, '<p>&nbsp;</p>')
        .replace(/<p><br class="[^"]*"\s*\/?><\/p>/g, '<p>&nbsp;</p>')

        // Heading 태그 인라인 스타일 (H1~H4)
        .replace(/<h1>/g, '<h1 style="font-size: 24px; font-weight: 700; line-height: 1.3; margin: 0 0 12px 0; color: #111827;">')
        .replace(/<h2>/g, '<h2 style="font-size: 20px; font-weight: 700; line-height: 1.3; margin: 0 0 10px 0; color: #1f2937;">')
        .replace(/<h3>/g, '<h3 style="font-size: 18px; font-weight: 600; line-height: 1.4; margin: 0 0 8px 0; color: #374151;">')
        .replace(/<h4>/g, '<h4 style="font-size: 16px; font-weight: 600; line-height: 1.4; margin: 0 0 6px 0; color: #4b5563;">')

        // p 태그에 기본 스타일 추가
        .replace(/<p>/g, '<p style="margin: 0 0 8px 0; font-size: 14px; color: #1f2937;">')

        // strong 태그 처리
        .replace(/<strong>/g, '<strong style="font-weight: 600;">')

        // em 태그 처리
        .replace(/<em>/g, '<em style="font-style: italic;">')

        // ul 태그 처리 (불렛 리스트)
        .replace(/<ul>/g, '<ul style="margin: 0 0 8px 0; padding-left: 20px; list-style-type: disc;">')

        // ol 태그 처리 (순서 리스트)
        .replace(/<ol>/g, '<ol style="margin: 0 0 8px 0; padding-left: 20px; list-style-type: decimal;">')

        // li 태그 처리
        .replace(/<li>/g, '<li style="margin-bottom: 4px;">')

        // blockquote 태그 처리 (인용)
        .replace(/<blockquote>/g, '<blockquote style="border-left: 3px solid #d1d5db; padding-left: 16px; margin: 0 0 8px 0; color: #6b7280; font-style: italic;">')

        /**
         * mark (형광펜) 태그 처리 - 멀티컬러 지원
         *
         * @note
         * TipTap Highlight 확장은 멀티컬러 모드에서
         * <mark data-color="#색상코드">텍스트</mark> 형식으로 HTML 생성.
         * 이를 인라인 스타일로 변환.
         *
         * @relatedFiles
         * - lib/tiptap/extensions.ts - Highlight.configure({ multicolor: true })
         * - components/email-editor/EmailEditorToolbar.tsx - HIGHLIGHT_COLORS
         */
        .replace(/<mark data-color="([^"]+)">/g, '<mark style="background-color: $1; padding: 2px 4px; border-radius: 2px;">')

        // 색상이 없는 기본 mark 태그 (노란색 기본값)
        .replace(/<mark>/g, '<mark style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">')

        // a (링크) 태그 처리 - href 속성 유지
        .replace(/<a /g, '<a style="color: #2563eb; text-decoration: underline;" ');
}
