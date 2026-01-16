/**
 * TipTap HTML 유틸리티
 *
 * TipTap JSON과 HTML 간의 변환 및 플레이스홀더 처리를 담당합니다.
 */

import { generateHTML, generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';

// TipTap 확장 목록 (HTML 변환에 사용)
const extensions = [StarterKit];

/**
 * TipTap JSON을 HTML로 변환
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
 * HTML을 TipTap JSON으로 변환
 */
export function htmlToTiptapJson(html: string): unknown {
    try {
        return generateJSON(html, extensions);
    } catch {
        return { type: 'doc', content: [{ type: 'paragraph' }] };
    }
}

/**
 * 플레이스홀더를 실제 값으로 치환
 *
 * @example
 * replacePlaceholders("안녕하세요 {제출자}님", { submitterName: "홍길동" })
 * // => "안녕하세요 홍길동님"
 */
export function replacePlaceholders(
    html: string,
    variables: { submitterName?: string }
): string {
    let result = html;

    // {제출자} -> 이름으로 치환 (이름이 없으면 빈 문자열)
    result = result.replace(/\{제출자\}/g, variables.submitterName || '');

    // {제출자님} -> 이름님으로 치환 (이름이 없으면 '님' 제거)
    result = result.replace(
        /\{제출자님\}/g,
        variables.submitterName ? `${variables.submitterName}님` : ''
    );

    return result;
}

/**
 * 플레이스홀더 목록
 */
export const PLACEHOLDERS = [
    { id: 'submitter', label: '제출자', placeholder: '{제출자}' },
] as const;

/**
 * HTML을 이메일에 안전한 형식으로 정리
 *
 * - CSS 클래스 대신 인라인 스타일 사용
 * - 이메일 클라이언트 호환성 확보
 */
export function sanitizeHtmlForEmail(html: string): string {
    // 기본적인 HTML 태그에 인라인 스타일 추가
    return html
        // p 태그에 기본 스타일 추가
        .replace(/<p>/g, '<p style="margin: 0 0 8px 0; font-size: 14px; color: #1f2937;">')
        // strong 태그 처리
        .replace(/<strong>/g, '<strong style="font-weight: 600;">')
        // em 태그 처리
        .replace(/<em>/g, '<em style="font-style: italic;">')
        // ul 태그 처리
        .replace(/<ul>/g, '<ul style="margin: 0 0 8px 0; padding-left: 20px; list-style-type: disc;">')
        // ol 태그 처리
        .replace(/<ol>/g, '<ol style="margin: 0 0 8px 0; padding-left: 20px; list-style-type: decimal;">')
        // li 태그 처리
        .replace(/<li>/g, '<li style="margin-bottom: 4px;">');
}
