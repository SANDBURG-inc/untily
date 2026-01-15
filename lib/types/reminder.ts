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

/**
 * 리마인드 시간 단위
 * - DAY: n일 전
 * - WEEK: n주 전
 */
export const ReminderTimeUnit = {
    DAY: 'DAY',
    WEEK: 'WEEK',
} as const;

export type ReminderTimeUnitType = (typeof ReminderTimeUnit)[keyof typeof ReminderTimeUnit];

/**
 * 발송 시간 옵션 (30분 단위)
 * 드롭다운에서 선택 가능한 모든 시간 목록
 */
export const SEND_TIME_OPTIONS = [
    '00:00', '00:30', '01:00', '01:30', '02:00', '02:30',
    '03:00', '03:30', '04:00', '04:30', '05:00', '05:30',
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
    '21:00', '21:30', '22:00', '22:30', '23:00', '23:30',
] as const;

export type SendTimeOption = (typeof SEND_TIME_OPTIONS)[number];

/**
 * 시간 단위 드롭다운 옵션
 */
export const TIME_UNIT_OPTIONS = [
    { value: 'DAY', label: '일' },
    { value: 'WEEK', label: '주' },
] as const;

/**
 * 시간 값 범위 (단위별)
 * - DAY: 1-30일
 * - WEEK: 1-4주
 */
export const TIME_VALUE_RANGE = {
    DAY: { min: 1, max: 30 },
    WEEK: { min: 1, max: 4 },
} as const;

/** 최대 리마인더 개수 */
export const MAX_REMINDER_COUNT = 3;

/**
 * 기본 리마인더 스케줄 설정
 * 새 리마인더 추가 시 기본값
 */
export const DEFAULT_REMINDER_SCHEDULE = {
    timeValue: 3,
    timeUnit: 'DAY' as ReminderTimeUnitType,
    sendTime: '09:00' as SendTimeOption,
};

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
 * 리마인더 스케줄 UI 상태
 * 컴포넌트에서 리마인더 설정을 관리할 때 사용
 */
export interface ReminderScheduleState {
    /** 고유 ID (신규: nanoid, 기존: DB ID) */
    id: string;
    /** 시간 값 (1, 2, 3...) */
    timeValue: number;
    /** 시간 단위 (DAY, WEEK) */
    timeUnit: ReminderTimeUnitType;
    /** 발송 시간 (HH:mm) */
    sendTime: string;
}

/**
 * 리마인더 스케줄 저장용 입력 타입
 * Server Action에 전달할 때 사용
 */
export interface ReminderScheduleInput {
    timeValue: number;
    timeUnit: ReminderTimeUnitType;
    sendTime: string;
    channel: ReminderChannelType;
}

/**
 * DB에서 조회한 리마인더 스케줄
 */
export interface ReminderScheduleFromDB {
    id: string;
    timeValue: number;
    timeUnit: ReminderTimeUnitType;
    sendTime: string;
    channel: ReminderChannelType;
    order: number;
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
