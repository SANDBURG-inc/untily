'use client';

import { useState, useId } from 'react';
import { parseISO } from 'date-fns';
import type { UseSubmissionSettingsOptions, UseSubmissionSettingsReturn } from './types';
import { type ReminderScheduleState, DEFAULT_REMINDER_SCHEDULE } from '@/lib/types/reminder';

/**
 * 제출 설정 상태 관리 훅
 *
 * 마감일, 리마인드 설정 관련 상태를 관리합니다.
 */
export function useSubmissionSettings(
  options: UseSubmissionSettingsOptions = {}
): UseSubmissionSettingsReturn {
  const { initialData } = options;
  const uniqueId = useId();

  // deadline: API에서는 문자열(ISO)로 전달하지만, DatePicker는 Date 객체를 사용
  const [deadline, setDeadline] = useState<Date | undefined>(
    initialData?.deadline ? parseISO(initialData.deadline) : undefined
  );

  const [reminderEnabled, setReminderEnabled] = useState(
    initialData?.reminderEnabled ?? true
  );
  const [emailReminder, setEmailReminder] = useState(
    initialData?.emailReminder ?? true
  );

  // SMS, Kakao는 현재 미지원 (추후 업데이트 예정)
  const [smsReminder] = useState(initialData?.smsReminder ?? false);
  const [kakaoReminder] = useState(initialData?.kakaoReminder ?? false);

  // 리마인더 스케줄 (초기값: initialData 또는 기본 스케줄)
  const [reminderSchedules, setReminderSchedules] = useState<ReminderScheduleState[]>(() => {
    if (initialData?.reminderSchedules && initialData.reminderSchedules.length > 0) {
      return initialData.reminderSchedules;
    }
    return [{ id: `default-${uniqueId}`, ...DEFAULT_REMINDER_SCHEDULE }];
  });

  return {
    // 상태
    deadline,
    reminderEnabled,
    emailReminder,
    smsReminder,
    kakaoReminder,
    reminderSchedules,
    // 액션
    setDeadline,
    setReminderEnabled,
    setEmailReminder,
    setReminderSchedules,
  };
}
