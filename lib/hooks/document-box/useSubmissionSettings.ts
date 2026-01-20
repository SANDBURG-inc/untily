'use client';

import { useState } from 'react';
import { parseISO } from 'date-fns';
import type { UseSubmissionSettingsOptions, UseSubmissionSettingsReturn } from './types';

/**
 * 제출 설정 상태 관리 훅
 *
 * 마감일, 리마인드 설정 관련 상태를 관리합니다.
 */
export function useSubmissionSettings(
  options: UseSubmissionSettingsOptions = {}
): UseSubmissionSettingsReturn {
  const { initialData } = options;

  // deadline: API에서는 문자열(YYYY-MM-DD)로 전달하지만, DatePicker는 Date 객체를 사용
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

  return {
    // 상태
    deadline,
    reminderEnabled,
    emailReminder,
    smsReminder,
    kakaoReminder,
    // 액션
    setDeadline,
    setReminderEnabled,
    setEmailReminder,
  };
}
