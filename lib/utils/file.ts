/**
 * 파일 관련 유틸리티 함수
 */

/**
 * 바이트를 읽기 쉬운 형식으로 변환
 * @example formatFileSize(1024) => "1 KB"
 * @example formatFileSize(1536000) => "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

/**
 * MIME 타입으로 미리보기 지원 여부 확인
 */
export function isPreviewSupported(mimeType: string): boolean {
    const supportedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
    ];
    return supportedTypes.includes(mimeType);
}

/**
 * MIME 타입에 따른 파일 아이콘 타입 반환
 */
export function getFileIconType(mimeType: string): 'image' | 'pdf' | 'document' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    return 'document';
}

/**
 * MIME 타입이 이미지인지 확인
 */
export function isImageMimeType(mimeType: string): boolean {
    return mimeType.startsWith('image/');
}

/**
 * MIME 타입이 PDF인지 확인
 */
export function isPdfMimeType(mimeType: string): boolean {
    return mimeType === 'application/pdf';
}
