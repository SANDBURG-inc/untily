'use client';

import { useCallback } from 'react';
import type { FormFieldData } from '@/lib/types/form-field';

/**
 * 질문 상태 관리 훅
 *
 * QuestionsCard의 복잡한 상태 관리 로직을 분리하여
 * 재사용성과 테스트 용이성을 높입니다.
 *
 * 그룹 개념이 제거되어 질문을 직접 관리합니다.
 */
export function useQuestions(
  questions: FormFieldData[],
  onChange: (questions: FormFieldData[]) => void
) {
  /**
   * 빈 질문 생성
   */
  const createEmptyQuestion = useCallback((order: number): FormFieldData => ({
    id: `question-${Date.now()}-${order}`,
    fieldLabel: '',
    fieldType: 'TEXT',
    placeholder: '텍스트를 입력하세요',
    isRequired: false,
    order,
    options: [],
    hasOtherOption: false,
  }), []);

  // ============================================================================
  // 질문 CRUD
  // ============================================================================

  /**
   * 새 질문 추가
   */
  const addQuestion = useCallback(() => {
    const newQuestion = createEmptyQuestion(questions.length);
    onChange([...questions, newQuestion]);
  }, [questions, onChange, createEmptyQuestion]);

  /**
   * 질문 삭제
   */
  const removeQuestion = useCallback((questionId: string) => {
    onChange(questions.filter((q) => q.id !== questionId));
  }, [questions, onChange]);

  /**
   * 질문 업데이트
   */
  const updateQuestion = useCallback((
    questionId: string,
    updates: Partial<FormFieldData>
  ) => {
    onChange(
      questions.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    );
  }, [questions, onChange]);

  /**
   * 질문 복사
   */
  const duplicateQuestion = useCallback((questionId: string) => {
    const questionIndex = questions.findIndex((q) => q.id === questionId);
    if (questionIndex === -1) return;

    const original = questions[questionIndex];
    const duplicate: FormFieldData = {
      ...original,
      id: `question-${Date.now()}-${questions.length}`,
      order: questions.length,
    };

    // 원본 바로 다음에 삽입
    const newQuestions = [...questions];
    newQuestions.splice(questionIndex + 1, 0, duplicate);

    // order 재정렬
    onChange(newQuestions.map((q, i) => ({ ...q, order: i })));
  }, [questions, onChange]);

  /**
   * 질문 순서 변경 (드래그앤드롭 후)
   */
  const reorderQuestions = useCallback((
    oldIndex: number,
    newIndex: number
  ) => {
    const newQuestions = [...questions];
    const [removed] = newQuestions.splice(oldIndex, 1);
    newQuestions.splice(newIndex, 0, removed);

    // order 재정렬
    onChange(newQuestions.map((q, i) => ({ ...q, order: i })));
  }, [questions, onChange]);

  return {
    // 질문 관리
    addQuestion,
    removeQuestion,
    updateQuestion,
    duplicateQuestion,
    reorderQuestions,
    // 헬퍼
    createEmptyQuestion,
  };
}
