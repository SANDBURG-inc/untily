/**
 * 이메일 템플릿 생성 모듈
 *
 * 리마인드 이메일의 HTML을 생성합니다.
 * 인사말/아랫말은 커스텀 가능하고, 문서함 정보는 자동 생성됩니다.
 */

import { sanitizeHtmlForEmail } from '@/lib/tiptap/html-utils';

// ============================================================================
// 기본 템플릿 상수
// ============================================================================

/**
 * 기본 인사말 HTML
 * {제출자_이름} 플레이스홀더는 발송 시 실제 이름으로 치환됩니다.
 */
export const DEFAULT_GREETING_HTML =
    '안녕하세요 {제출자_이름}님,<br/>아래 문서 제출을 요청드립니다. 마감일까지 제출 부탁드립니다.';

/**
 * 기본 아랫말 HTML
 */
export const DEFAULT_FOOTER_HTML =
    '위 링크를 통해 문서를 제출해주시기 바랍니다.<br/>감사합니다.';

// ============================================================================
// 타입 정의
// ============================================================================

export interface EmailTemplateParams {
    submitterName?: string; // Optional for preview (generic "안녕하세요," vs "안녕하세요 홍길동님,")
    documentBoxTitle: string;
    documentBoxDescription?: string | null;
    endDate: Date;
    requiredDocuments: {
        name: string;
        description: string | null;
        isRequired: boolean;
    }[];
    submissionLink: string;
    // 커스텀 템플릿 (선택사항)
    customGreetingHtml?: string;
    customFooterHtml?: string;
}

export interface DocumentInfoParams {
    documentBoxTitle: string;
    documentBoxDescription?: string | null;
    endDate: Date;
    requiredDocuments: {
        name: string;
        description: string | null;
        isRequired: boolean;
    }[];
    submissionLink: string;
}

// ============================================================================
// 플레이스홀더 처리
// ============================================================================

/**
 * 플레이스홀더를 실제 값으로 치환
 *
 * @example
 * replacePlaceholders("안녕하세요 {제출자_이름}님", "홍길동")
 * // => "안녕하세요 홍길동님"
 */
export function replacePlaceholders(
    html: string,
    submitterName?: string
): string {
    let result = html;

    // {제출자_이름} -> 이름으로 치환 (이름이 없으면 빈 문자열)
    result = result.replace(/\{제출자_이름\}/g, submitterName || '');

    // {제출자} -> 이름으로 치환 (하위 호환성)
    result = result.replace(/\{제출자\}/g, submitterName || '');

    // {제출자님} -> 이름님으로 치환 (이름이 없으면 빈 문자열)
    result = result.replace(
        /\{제출자님\}/g,
        submitterName ? `${submitterName}님` : ''
    );

    return result;
}

// ============================================================================
// 문서함 정보 섹션 생성 (편집 불가 영역)
// ============================================================================

/**
 * 문서함 정보 섹션 HTML 생성
 *
 * 이 부분은 사용자가 편집할 수 없는 자동 생성 영역입니다.
 * 문서함 제목, 설명, 마감일, 서류 목록, 제출 링크가 포함됩니다.
 */
export function generateDocumentInfoHtml({
    documentBoxTitle,
    documentBoxDescription,
    endDate,
    requiredDocuments,
    submissionLink,
}: DocumentInfoParams): string {
    const documentsHtml = requiredDocuments
        .map(
            (doc) =>
                `<li style="margin-bottom: 4px;">
            <span style="font-weight: 500; color: #1f2937;">${doc.name}</span>
            ${doc.isRequired ? '<span style="background-color: #fef2f2; color: #dc2626; font-size: 11px; font-weight: bold; padding: 2px 6px; border-radius: 9999px; margin-left: 6px;">필수서류</span>' : ''}
            ${doc.description ? `<span style="color: #6b7280; font-size: 12px; margin-left: 4px;">: ${doc.description}</span>` : ''}
        </li>`
        )
        .join('');

    const formattedDate =
        endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;

    const linkHtml =
        submissionLink === '(제출자별 링크가 생성됩니다)'
            ? `<span style="font-size: 14px; color: #2563eb; word-break: break-all;">${submissionLink}</span>`
            : `<a href="${submissionLink}" style="font-size: 14px; color: #2563eb; text-decoration: underline; word-break: break-all;">${submissionLink}</a>`;

    return `
        <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 24px; margin: 20px 0;">
            <h4 style="margin: 0 0 12px 0; font-size: 18px; font-weight: bold; color: #111827;">${documentBoxTitle} 서류 제출</h4>
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #4b5563;">${documentBoxDescription || '필수 서류를 제출해주세요.'}</p>

            <div style="margin-bottom: 16px; font-size: 14px; color: #374151;">
                <span style="font-weight: 600; margin-right: 4px;">📅 마감일:</span>
                <span>${formattedDate}</span>
            </div>

            <div style="margin-bottom: 20px;">
                <span style="display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">📑 제출 서류:</span>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4b5563; list-style-type: disc;">
                    ${documentsHtml}
                </ul>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px;">
                <span style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px;">제출 링크</span>
                ${linkHtml}
            </div>
        </div>
    `;
}

// ============================================================================
// 전체 이메일 HTML 생성
// ============================================================================

/**
 * 리마인드 이메일 HTML 생성
 *
 * 커스텀 인사말/아랫말이 있으면 사용하고, 없으면 기본값 사용
 */
export function generateReminderEmailHtml({
    submitterName,
    documentBoxTitle,
    documentBoxDescription,
    endDate,
    requiredDocuments,
    submissionLink,
    customGreetingHtml,
    customFooterHtml,
}: EmailTemplateParams): string {
    // 인사말 결정 (커스텀 또는 기본값) + 인라인 스타일 변환
    const greetingHtml = sanitizeHtmlForEmail(
        replacePlaceholders(
            customGreetingHtml || DEFAULT_GREETING_HTML,
            submitterName
        )
    );

    // 아랫말 결정 (커스텀 또는 기본값) + 인라인 스타일 변환
    const footerHtml = sanitizeHtmlForEmail(
        customFooterHtml || DEFAULT_FOOTER_HTML
    );

    // 문서함 정보 (자동 생성)
    const documentInfoHtml = generateDocumentInfoHtml({
        documentBoxTitle,
        documentBoxDescription,
        endDate,
        requiredDocuments,
        submissionLink,
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #333;">
    <div style="max-width: 600px; margin: 0 auto;">
        <div style="font-size: 14px; color: #1f2937;">${greetingHtml}</div>

        ${documentInfoHtml}

        <div style="font-size: 12px; color: #6b7280; margin-top: 16px;">${footerHtml}</div>
    </div>
</body>
</html>
    `;
}

// ============================================================================
// 미리보기용 함수
// ============================================================================

/**
 * 미리보기용 인사말 HTML 생성
 *
 * 플레이스홀더를 치환하지 않고 그대로 표시합니다.
 * 예: "안녕하세요 {제출자_이름}님,"
 */
export function getGreetingHtmlForPreview(customGreetingHtml?: string): string {
    return customGreetingHtml || DEFAULT_GREETING_HTML;
}

/**
 * 미리보기용 아랫말 HTML 생성
 */
export function getFooterHtmlForPreview(customFooterHtml?: string): string {
    return customFooterHtml || DEFAULT_FOOTER_HTML;
}
