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
}

export function generateReminderEmailHtml({
    submitterName,
    documentBoxTitle,
    documentBoxDescription,
    endDate,
    requiredDocuments,
    submissionLink
}: EmailTemplateParams): string {
    const documentsHtml = requiredDocuments.map(doc =>
        `<li style="margin-bottom: 4px;">
            <span style="font-weight: 500; color: #1f2937;">${doc.name}</span>
            ${doc.isRequired ? '<span style="background-color: #fef2f2; color: #dc2626; font-size: 11px; font-weight: bold; padding: 2px 6px; border-radius: 9999px; margin-left: 6px;">필수서류</span>' : ''}
            ${doc.description ? `<span style="color: #6b7280; font-size: 12px; margin-left: 4px;">: ${doc.description}</span>` : ''}
        </li>`
    ).join('');

    const greeting = submitterName ? `안녕하세요 ${submitterName}님,` : `안녕하세요,`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #333;">
    <div style="max-width: 600px; margin: 0 auto;">
        <p style="font-size: 14px; color: #1f2937;">${greeting}<br/>아래 문서 제출을 요청드립니다. 마감일까지 제출 부탁드립니다.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 24px; margin: 20px 0;">
            <h4 style="margin: 0 0 12px 0; font-size: 18px; font-weight: bold; color: #111827;">${documentBoxTitle} 서류 제출</h4>
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #4b5563;">${documentBoxDescription || '필수 서류를 제출해주세요.'}</p>
            
            <div style="margin-bottom: 16px; font-size: 14px; color: #374151;">
                <span style="font-weight: 600; margin-right: 4px;">📅 마감일:</span>
                <span>${endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate}</span>
            </div>

            <div style="margin-bottom: 20px;">
                <span style="display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">📑 제출 서류:</span>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4b5563; list-style-type: disc;">
                    ${documentsHtml}
                </ul>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px;">
                <span style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px;">제출 링크</span>
                ${submissionLink === "(제출자별 링크가 생성됩니다)"
            ? `<span style="font-size: 14px; color: #2563eb; word-break: break-all;">${submissionLink}</span>`
            : `<a href="${submissionLink}" style="font-size: 14px; color: #2563eb; text-decoration: underline; word-break: break-all;">${submissionLink}</a>`}
            </div>
        </div>

        <p style="font-size: 12px; color: #6b7280; margin-top: 16px;">위 링크를 통해 문서를 제출해주시기 바랍니다.<br/>감사합니다.</p>
    </div>
</body>
</html>
    `;
}
