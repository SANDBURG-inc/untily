'use client';

import { useState } from 'react';
import type { FormFieldGroupData } from '@/lib/types/form-field';
import type { UseFormFieldGroupsOptions, UseFormFieldGroupsReturn } from './types';

/**
 * 폼 필드 그룹 상태 관리 훅
 *
 * 정보 입력 항목(폼 필드) 목록과 표시 위치를 관리합니다.
 */
export function useFormFieldGroups(
  options: UseFormFieldGroupsOptions = {}
): UseFormFieldGroupsReturn {
  const { initialData } = options;

  const [formFieldGroups, setFormFieldGroups] = useState<FormFieldGroupData[]>(
    initialData?.formFieldGroups || []
  );

  const [formFieldsAboveDocuments, setFormFieldsAboveDocuments] = useState<boolean>(
    initialData?.formFieldsAboveDocuments ?? false
  );

  return {
    // 상태
    formFieldGroups,
    formFieldsAboveDocuments,
    // 액션
    setFormFieldGroups,
    setFormFieldsAboveDocuments,
  };
}
