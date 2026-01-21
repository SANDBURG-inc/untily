/**
 * 제출자 관련 타입, 상수, 유틸리티 함수
 */

// ========== 타입 ==========

export type SubmissionStatus = '제출완료' | '미제출' | '부분제출';
export type StatusFilter = 'all' | SubmissionStatus;

// 제출자 DB 상태 (Prisma enum과 동일)
export type SubmitterStatus = 'PENDING' | 'SUBMITTED' | 'REJECTED';

// 제출 경험이 있는 상태 (한 번이라도 제출한 상태)
export type SubmittedSubmitterStatus = 'SUBMITTED' | 'REJECTED';

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

// 제출자 상태별 스타일 (DB 상태용)
export const SUBMITTER_STATUS_STYLES: Record<SubmittedSubmitterStatus, string> = {
    'SUBMITTED': 'bg-green-100 text-green-700',
    'REJECTED': 'bg-red-100 text-red-700',
} as const;

// 제출자 상태별 레이블 (DB 상태용)
export const SUBMITTER_STATUS_LABELS: Record<SubmittedSubmitterStatus, string> = {
    'SUBMITTED': '제출됨',
    'REJECTED': '반려됨',
} as const;

// 상태 변경 옵션 (드롭다운용)
export const SUBMITTER_STATUS_CHANGE_OPTIONS: {
    from: SubmittedSubmitterStatus;
    to: SubmittedSubmitterStatus;
    label: string;
}[] = [
    { from: 'SUBMITTED', to: 'REJECTED', label: '반려로 변경' },
    { from: 'REJECTED', to: 'SUBMITTED', label: '제출됨으로 변경' },
] as const;

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

/** 제출 경험 여부 (한 번이라도 제출했으면 true) */
export function hasEverSubmitted(status: SubmitterStatus): boolean {
    return status === 'SUBMITTED' || status === 'REJECTED';
}

/** 현재 상태에서 변경 가능한 상태 옵션 반환 */
export function getSubmitterStatusChangeOptions(currentStatus: SubmittedSubmitterStatus) {
    return SUBMITTER_STATUS_CHANGE_OPTIONS.filter(opt => opt.from === currentStatus);
}
