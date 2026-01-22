'use client';

import { useState, useCallback } from 'react';
import type { FormFieldData, FormFieldGroupData } from '@/lib/types/form-field';
import type { UseFormFieldGroupsOptions, UseFormFieldGroupsReturn } from './types';

/**
 * 기존 formFieldGroups를 평탄한 questions 배열로 변환
 */
function flattenFormFieldGroups(groups: FormFieldGroupData[]): FormFieldData[] {
  return groups.flatMap((group) => group.fields);
}

/**
 * 평탄한 questions 배열을 기존 formFieldGroups 형식으로 변환 (API 호환성)
 * 그룹 없이 모든 질문을 하나의 가상 그룹에 넣음
 */
function wrapQuestionsInGroup(questions: FormFieldData[]): FormFieldGroupData[] {
  if (questions.length === 0) return [];

  return [{
    id: 'default-group',
    groupTitle: '질문',
    groupDescription: undefined,
    isRequired: true,
    order: 0,
    fields: questions,
  }];
}

/**
 * 폼 필드 (질문) 상태 관리 훅
 *
 * 정보 입력 항목(질문) 목록과 표시 위치를 관리합니다.
 * 내부적으로는 평탄한 questions 배열을 사용하며,
 * API 호환성을 위해 formFieldGroups 형식으로도 반환합니다.
 */
export function useFormFieldGroups(
  options: UseFormFieldGroupsOptions = {}
): UseFormFieldGroupsReturn {
  const { initialData } = options;

  // 초기 데이터에서 questions 추출 (기존 formFieldGroups에서 평탄화)
  const initialQuestions = initialData?.formFieldGroups
    ? flattenFormFieldGroups(initialData.formFieldGroups)
    : [];

  const [questions, setQuestions] = useState<FormFieldData[]>(initialQuestions);

  const [formFieldsAboveDocuments, setFormFieldsAboveDocuments] = useState<boolean>(
    initialData?.formFieldsAboveDocuments ?? false
  );

  // API 호환성을 위한 formFieldGroups 변환
  const setFormFieldGroups = useCallback((groups: FormFieldGroupData[]) => {
    setQuestions(flattenFormFieldGroups(groups));
  }, []);

  return {
    // 상태 - 새로운 questions 배열 (UI에서 사용)
    questions,
    setQuestions,
    // 상태 - 기존 formFieldGroups 형식 (API 호환성)
    formFieldGroups: wrapQuestionsInGroup(questions),
    formFieldsAboveDocuments,
    // 액션
    setFormFieldGroups, // 기존 호환성
    setFormFieldsAboveDocuments,
  };
}
