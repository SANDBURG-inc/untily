'use client';

import { useState, useCallback } from 'react';
import type { Submitter } from '@/lib/types/document';
import type { UseSubmittersOptions, UseSubmittersReturn } from './types';

/**
 * 제출자 상태 관리 훅
 *
 * 제출자 활성화 여부와 제출자 목록을 관리합니다.
 */
export function useSubmitters(options: UseSubmittersOptions = {}): UseSubmittersReturn {
  const { initialData } = options;

  const [submittersEnabled, setSubmittersEnabled] = useState(
    initialData?.submittersEnabled ?? true
  );
  const [submitters, setSubmitters] = useState<Submitter[]>(
    initialData?.submitters || [{ id: '1', name: '', email: '', phone: '' }]
  );

  /**
   * 제출자 기능 활성화/비활성화 핸들러
   * 비활성화 시 onDisable 콜백 호출 (리마인드 비활성화 등)
   */
  const handleSubmittersEnabledChange = useCallback(
    (enabled: boolean, onDisable?: () => void) => {
      setSubmittersEnabled(enabled);
      if (!enabled && onDisable) {
        onDisable();
      }
    },
    []
  );

  return {
    // 상태
    submittersEnabled,
    submitters,
    // 액션
    setSubmittersEnabled,
    setSubmitters,
    handleSubmittersEnabledChange,
  };
}
