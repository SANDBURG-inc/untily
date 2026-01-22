/**
 * URL 생성 유틸리티
 *
 * 환경변수 기반으로 동적 URL을 생성합니다.
 * - NEXT_PUBLIC_APP_URL: 클라이언트/서버 모두에서 사용 가능
 * - 설정되지 않은 경우 기본값: https://untily.kr
 *
 * 환경별 설정 예시:
 * - 로컬: http://localhost:3000
 * - 개발: https://dev.untily.kr
 * - 운영: https://untily.kr
 */

/**
 * 앱 기본 URL 반환
 *
 * @example
 * getAppUrl() // => "https://untily.kr" or "http://localhost:3000"
 */
export function getAppUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || 'https://untily.kr';
}

/**
 * 서류 제출 페이지 URL 생성
 *
 * @param documentBoxId 문서함 ID
 * @param submitterId 제출자 ID (선택) - 없으면 공유 링크용
 * @returns 제출 페이지 URL
 *
 * @example
 * // 공유 링크 (제출자 ID 없음)
 * getSubmissionUrl("box123") // => "https://untily.kr/submit/box123"
 *
 * // 개인별 제출 링크
 * getSubmissionUrl("box123", "user456") // => "https://untily.kr/submit/box123/user456"
 */
export function getSubmissionUrl(documentBoxId: string, submitterId?: string): string {
    const baseUrl = getAppUrl();

    if (submitterId) {
        return `${baseUrl}/submit/${documentBoxId}/${submitterId}`;
    }

    return `${baseUrl}/submit/${documentBoxId}`;
}
