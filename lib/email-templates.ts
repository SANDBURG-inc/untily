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
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #4b5563; white-space: pre-line;">${documentBoxDescription || '필수 서류를 제출해주세요.'}</p>

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

// ============================================================================
// 마감 알림 이메일 (문서함 생성자용)
// ============================================================================

export interface DeadlineNotificationParams {
    /** 문서함 생성자 이름 */
    ownerName?: string;
    /** 문서함 제목 */
    documentBoxTitle: string;
    /** 문서함 ID */
    documentBoxId: string;
    /** 마감일 */
    endDate: Date;
    /** 전체 제출자 수 */
    totalSubmitters: number;
    /** 제출 완료 수 */
    submittedCount: number;
    /** 미제출 수 (지정 제출자: PENDING+REJECTED, 비지정: REJECTED) */
    notSubmittedCount: number;
    /** 알림 유형: 'd-3' | 'd-day' | 'closed' */
    notificationType: 'd-3' | 'd-day' | 'closed';
    /** 지정 제출자 문서함 여부 */
    hasDesignatedSubmitters: boolean;
}

/**
 * 마감 알림 이메일 HTML 생성 (문서함 생성자용)
 *
 * 문서함 마감 3일 전, 당일, 마감 후에 생성자에게 발송되는 이메일입니다.
 */
export function generateDeadlineNotificationHtml({
    ownerName,
    documentBoxTitle,
    documentBoxId,
    endDate,
    totalSubmitters,
    submittedCount,
    notSubmittedCount,
    notificationType,
    hasDesignatedSubmitters,
}: DeadlineNotificationParams): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://untily.kr';
    const dashboardLink = `${appUrl}/dashboard/${documentBoxId}`;

    const formattedDate =
        endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;

    // 알림 유형별 메시지
    const getMessage = () => {
        switch (notificationType) {
            case 'd-3':
                return {
                    title: '마감 3일 전 알림',
                    urgency: '3일 후',
                    emoji: '📋',
                    statusColor: '#d97706', // amber-600
                };
            case 'd-day':
                return {
                    title: '오늘 마감 알림',
                    urgency: '오늘',
                    emoji: '⚡',
                    statusColor: '#dc2626', // red-600
                };
            case 'closed':
                return {
                    title: '마감 완료 알림',
                    urgency: '마감됨',
                    emoji: '✅',
                    statusColor: '#059669', // emerald-600
                };
        }
    };

    const message = getMessage();
    const greeting = ownerName ? `${ownerName}님 안녕하세요,` : '안녕하세요,';

    const bodyText =
        notificationType === 'closed'
            ? `'${documentBoxTitle}' 문서함이 마감되었습니다.`
            : `'${documentBoxTitle}' 문서함이 ${message.urgency} 마감됩니다.`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <!-- 헤더 -->
        <div style="background-color: ${message.statusColor}; padding: 24px; text-align: center;">
            <span style="font-size: 32px;">${message.emoji}</span>
            <h1 style="margin: 12px 0 0 0; font-size: 20px; font-weight: 600; color: #ffffff;">${documentBoxTitle}</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">${message.title}</p>
        </div>

        <!-- 본문 -->
        <div style="padding: 32px 24px;">
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151;">${greeting}</p>
            <p style="margin: 0 0 8px 0; font-size: 15px; color: #374151;">오늘까지입니다.</p>
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151; font-weight: 500;">${bodyText}</p>

            <!-- 현황 카드 -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #64748b;">📊 현재 현황</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                    <div style="flex: 1; min-width: 100px; text-align: center; padding: 12px; background-color: #ffffff; border-radius: 6px;">
                        <div style="font-size: 24px; font-weight: 700; color: #1e293b;">${totalSubmitters}</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">전체 제출자</div>
                    </div>
                    <div style="flex: 1; min-width: 100px; text-align: center; padding: 12px; background-color: #ffffff; border-radius: 6px;">
                        <div style="font-size: 24px; font-weight: 700; color: #059669;">${submittedCount}</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${hasDesignatedSubmitters ? '제출 완료' : '제출됨'}</div>
                    </div>
                    <div style="flex: 1; min-width: 100px; text-align: center; padding: 12px; background-color: #ffffff; border-radius: 6px;">
                        <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${notSubmittedCount}</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${hasDesignatedSubmitters ? '미제출' : '반려됨'}</div>
                    </div>
                </div>
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                    <div style="font-size: 13px; color: #64748b;">
                        <span style="font-weight: 500;">📅 마감일:</span> ${formattedDate}
                    </div>
                </div>
            </div>

            <!-- CTA 버튼 -->
            <div style="text-align: center;">
                <a href="${dashboardLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                    👉 지금 바로 확인하기
                </a>
            </div>
        </div>

        <!-- 푸터 -->
        <div style="padding: 20px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                감사합니다.<br/>
                오늘까지 팀 드림
            </p>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * 마감 알림 이메일 제목 생성
 */
export function getDeadlineNotificationSubject(
    documentBoxTitle: string,
    notificationType: 'd-3' | 'd-day' | 'closed'
): string {
    switch (notificationType) {
        case 'd-3':
            return `[오늘까지] '${documentBoxTitle}' 마감 3일 전입니다`;
        case 'd-day':
            return `[오늘까지] '${documentBoxTitle}' 오늘 마감됩니다`;
        case 'closed':
            return `[오늘까지] '${documentBoxTitle}' 문서함이 마감되었습니다`;
    }
}
