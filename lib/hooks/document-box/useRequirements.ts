'use client';

import { useState, useCallback } from 'react';
import type { DocumentRequirement, TemplateFile } from '@/lib/types/document';
import type { UseRequirementsOptions, UseRequirementsReturn } from './types';

/**
 * 서류 요구사항 상태 관리 훅
 *
 * 수집 서류 목록과 양식 파일 관련 상태를 관리합니다.
 */
export function useRequirements(options: UseRequirementsOptions = {}): UseRequirementsReturn {
  const { initialData } = options;

  const [requirements, setRequirements] = useState<DocumentRequirement[]>(
    initialData?.requirements || [
      { id: '1', name: '', type: '필수', description: '', templates: [] },
    ]
  );

  /**
   * 특정 요구사항에 양식 파일 추가 (미리보기용)
   */
  const addTemplateToRequirement = useCallback(
    (requirementId: string, template: TemplateFile) => {
      setRequirements((prev) =>
        prev.map((r) => {
          if (r.id === requirementId) {
            const currentTemplates = r.templates || [];
            return {
              ...r,
              templates: [...currentTemplates, template],
            };
          }
          return r;
        })
      );
    },
    []
  );

  /**
   * 특정 요구사항에서 양식 파일 제거
   */
  const removeTemplateFromRequirement = useCallback(
    (requirementId: string, index: number) => {
      setRequirements((prev) =>
        prev.map((r) => {
          if (r.id === requirementId && r.templates) {
            const newTemplates = [...r.templates];
            newTemplates.splice(index, 1);
            return {
              ...r,
              templates: newTemplates,
            };
          }
          return r;
        })
      );
    },
    []
  );

  return {
    // 상태
    requirements,
    // 액션
    setRequirements,
    addTemplateToRequirement,
    removeTemplateFromRequirement,
  };
}
