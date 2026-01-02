/**
 * 리마인드 기능 관련 타입, 상수, 유틸리티 함수
 *
 * 이 파일은 서비스 전반에서 리마인드 기능에 사용되는 공통 타입과 함수를 정의합니다.
 * - 리마인드 채널 (EMAIL, SMS, PUSH) 관련 타입 및 레이블
 * - 리마인드 로그 타입
 * - 수신자 텍스트 포맷팅 등 유틸리티 함수
 *
 * @module lib/types/reminder
 */

// ============================================================================
// 상수 (Constants)
// ============================================================================

/**
 * 리마인드 채널 타입
 * - EMAIL: 이메일 알림
 * - SMS: 문자 메시지 알림
 * - PUSH: 앱 푸시 알림 (알림톡)
 */
export const ReminderChannel = {
    EMAIL: 'EMAIL',
    SMS: 'SMS',
    PUSH: 'PUSH',
} as const;

export type ReminderChannelType = (typeof ReminderChannel)[keyof typeof ReminderChannel];

/**
 * 리마인드 채널별 한글 레이블 매핑
 * UI에서 채널을 표시할 때 사용합니다.
 */
export const REMINDER_CHANNEL_LABELS: Record<ReminderChannelType, string> = {
    [ReminderChannel.EMAIL]: '이메일',
    [ReminderChannel.SMS]: '문자',
    [ReminderChannel.PUSH]: '앱 푸시',
} as const;

// ============================================================================
// 타입 (Types)
// ============================================================================

/**
 * 리마인드 수신자 정보
 */
export interface ReminderRecipient {
    submitter: {
        name: string;
    };
}

/**
 * 리마인드 발송 로그
 */
export interface ReminderLog {
    /** 로그 고유 ID */
    id: string;
    /** 발송 일시 */
    sentAt: Date;
    /** 발송 채널 */
    channel: ReminderChannelType;
    /** 자동 발송 여부 */
    isAuto: boolean;
    /** 수신자 목록 */
    recipients: ReminderRecipient[];
}

// ============================================================================
// 유틸리티 함수 (Utility Functions)
// ============================================================================

/**
 * 리마인드 채널 코드를 한글 레이블로 변환합니다.
 *
 * @param channel - 리마인드 채널 타입 (EMAIL, SMS, PUSH)
 * @returns 한글 레이블 (이메일, 문자, 앱 푸시)
 *
 * @example
 * getReminderChannelLabel('EMAIL') // '이메일'
 * getReminderChannelLabel('SMS')   // '문자'
 */
export function getReminderChannelLabel(channel: ReminderChannelType): string {
    return REMINDER_CHANNEL_LABELS[channel];
}

/**
 * 수신자 목록을 요약 텍스트로 변환합니다.
 *
 * @param recipients - 수신자 목록
 * @returns 포맷팅된 텍스트
 *   - 0명: '수신자 없음'
 *   - 1명: '홍길동'
 *   - 2명 이상: '홍길동 외 N명'
 *
 * @example
 * formatReminderRecipients([])                           // '수신자 없음'
 * formatReminderRecipients([{ submitter: { name: '홍길동' } }]) // '홍길동'
 * formatReminderRecipients([
 *   { submitter: { name: '홍길동' } },
 *   { submitter: { name: '김철수' } }
 * ]) // '홍길동 외 1명'
 */
export function formatReminderRecipients(recipients: ReminderRecipient[]): string {
    const count = recipients.length;

    if (count === 0) {
        return '수신자 없음';
    }

    if (count === 1) {
        return recipients[0].submitter.name;
    }

    return `${recipients[0].submitter.name} 외 ${count - 1}명`;
}

/**
 * 대표 이름과 총 인원수로 수신자 요약 텍스트를 생성합니다.
 * 페이지네이션 환경에서 전체 수신자를 로드하지 않고 요약 텍스트를 생성할 때 사용합니다.
 *
 * @param firstName - 대표 수신자 이름
 * @param totalCount - 전체 수신자 수
 * @returns 포맷팅된 텍스트
 *   - 0명: '수신자 없음'
 *   - 1명: '홍길동'
 *   - 2명 이상: '홍길동 외 N명'
 *
 * @example
 * formatReminderRecipientsCount('홍길동', 0)  // '수신자 없음'
 * formatReminderRecipientsCount('홍길동', 1)  // '홍길동'
 * formatReminderRecipientsCount('홍길동', 5)  // '홍길동 외 4명'
 */
export function formatReminderRecipientsCount(
    firstName: string,
    totalCount: number
): string {
    if (totalCount === 0) {
        return '수신자 없음';
    }

    if (totalCount === 1) {
        return firstName;
    }

    return `${firstName} 외 ${totalCount - 1}명`;
}
