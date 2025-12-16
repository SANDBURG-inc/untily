/**
 * CSV 파일 생성 및 다운로드 유틸리티
 * 한글 인코딩(BOM)을 지원하여 Excel에서 정상적으로 열림
 */

export interface CsvExportOptions {
    filename: string;
    headers: string[];
    rows: string[][];
}

/**
 * CSV 파일을 생성하고 다운로드
 * @param options - filename, headers, rows
 */
export function downloadCsv({ filename, headers, rows }: CsvExportOptions): void {
    // BOM을 추가하여 Excel에서 한글이 깨지지 않도록 함
    const BOM = '\uFEFF';

    const csvContent = BOM + [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${escapeCell(cell)}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * CSV 셀 내용 이스케이프 (따옴표 처리)
 */
function escapeCell(value: string): string {
    return value.replace(/"/g, '""');
}
