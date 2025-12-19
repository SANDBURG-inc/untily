/**
 * 제출자 관련 타입, 상수, 유틸리티 함수
 */

// ========== 타입 ==========

export type SubmissionStatus = '제출완료' | '미제출' | '부분제출';
export type StatusFilter = 'all' | SubmissionStatus;

// ========== 상수 ==========

export const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: '제출완료', label: '제출완료' },
    { value: '부분제출', label: '부분제출' },
    { value: '미제출', label: '미제출' },
] as const;

export const SUBMISSION_STATUS_STYLES: Record<SubmissionStatus, string> = {
    '제출완료': 'bg-green-100 text-green-700',
    '미제출': 'bg-gray-100 text-gray-700',
    '부분제출': 'bg-yellow-100 text-yellow-700',
} as const;

// ========== 유틸리티 함수 ==========

/** 제출 상태 계산 */
export function getSubmissionStatus(submittedCount: number, totalRequired: number): SubmissionStatus {
    if (totalRequired === 0) return '제출완료';
    if (submittedCount === 0) return '미제출';
    if (submittedCount >= totalRequired) return '제출완료';
    return '부분제출';
}

/** 상태별 스타일 반환 */
export function getStatusStyle(status: SubmissionStatus): string {
    return SUBMISSION_STATUS_STYLES[status];
}

/** 진행상황 포맷팅 */
export function formatProgress(submittedCount: number, totalRequired: number): string {
    if (totalRequired === 0) return '-';
    const percentage = Math.round((submittedCount / totalRequired) * 100);
    return `${submittedCount}/${totalRequired} (${percentage}%)`;
}

/** 제출일 포맷팅 */
export function formatSubmissionDate(date: Date | null): string {
    if (!date) return '-';
    return date.toISOString().split('T')[0];
}
