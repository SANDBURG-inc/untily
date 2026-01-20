'use client';

import { useCallback } from 'react';
import type { FormFieldGroupData, FormFieldData, FormFieldType } from '@/lib/types/form-field';
import { FORM_FIELD_TYPE_PLACEHOLDERS, requiresOptions } from '@/lib/types/form-field';

/**
 * 폼 필드 그룹 상태 관리 훅
 *
 * FormFieldGroupsCard의 복잡한 상태 관리 로직을 분리하여
 * 재사용성과 테스트 용이성을 높입니다.
 */
export function useFormFieldGroups(
  groups: FormFieldGroupData[],
  onChange: (groups: FormFieldGroupData[]) => void
) {
  /**
   * 빈 필드 생성
   */
  const createEmptyField = useCallback((order: number): FormFieldData => ({
    id: `field-${Date.now()}-${order}`,
    fieldLabel: '',
    fieldType: 'TEXT',
    placeholder: '',
    isRequired: true,
    order,
    options: [],
  }), []);

  // ============================================================================
  // 그룹 CRUD
  // ============================================================================

  /**
   * 새 그룹 추가
   */
  const addGroup = useCallback(() => {
    const newGroup: FormFieldGroupData = {
      id: `group-${Date.now()}`,
      groupTitle: '',
      groupDescription: '',
      isRequired: true,
      order: groups.length,
      fields: [createEmptyField(0)],
    };
    onChange([...groups, newGroup]);
  }, [groups, onChange, createEmptyField]);

  /**
   * 그룹 삭제
   */
  const removeGroup = useCallback((groupId: string) => {
    onChange(groups.filter((g) => g.id !== groupId));
  }, [groups, onChange]);

  /**
   * 그룹 업데이트
   */
  const updateGroup = useCallback((
    groupId: string,
    field: keyof FormFieldGroupData,
    value: string | boolean | number
  ) => {
    onChange(
      groups.map((g) =>
        g.id === groupId ? { ...g, [field]: value } : g
      )
    );
  }, [groups, onChange]);

  // ============================================================================
  // 필드 CRUD
  // ============================================================================

  /**
   * 필드 추가
   */
  const addField = useCallback((groupId: string) => {
    onChange(
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            fields: [...g.fields, createEmptyField(g.fields.length)],
          };
        }
        return g;
      })
    );
  }, [groups, onChange, createEmptyField]);

  /**
   * 필드 삭제
   */
  const removeField = useCallback((groupId: string, fieldId: string) => {
    onChange(
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            fields: g.fields.filter((f) => f.id !== fieldId),
          };
        }
        return g;
      })
    );
  }, [groups, onChange]);

  /**
   * 단일 필드 속성 업데이트
   */
  const updateField = useCallback((
    groupId: string,
    fieldId: string,
    field: keyof FormFieldData,
    value: string | boolean | number | string[]
  ) => {
    onChange(
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            fields: g.fields.map((f) =>
              f.id === fieldId ? { ...f, [field]: value } : f
            ),
          };
        }
        return g;
      })
    );
  }, [groups, onChange]);

  /**
   * 여러 필드 속성 동시 업데이트 (버그 수정용)
   *
   * 타입 변경 시 fieldType, placeholder, options를 한 번의 상태 업데이트로 처리하여
   * 연쇄 리렌더링으로 인한 select 동기화 문제를 방지합니다.
   */
  const updateFieldMultiple = useCallback((
    groupId: string,
    fieldId: string,
    updates: Partial<FormFieldData>
  ) => {
    onChange(
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            fields: g.fields.map((f) =>
              f.id === fieldId ? { ...f, ...updates } : f
            ),
          };
        }
        return g;
      })
    );
  }, [groups, onChange]);

  /**
   * 필드 타입 변경 (placeholder와 options 자동 설정)
   *
   * 타입 변경 시 관련 속성들을 한 번에 업데이트하여
   * 연쇄 리렌더링 문제를 방지합니다.
   */
  const changeFieldType = useCallback((
    groupId: string,
    fieldId: string,
    newType: FormFieldType,
    currentOptions?: string[]
  ) => {
    const updates: Partial<FormFieldData> = {
      fieldType: newType,
      placeholder: FORM_FIELD_TYPE_PLACEHOLDERS[newType],
    };

    // RADIO로 변경 시 기본 선택지 추가
    if (requiresOptions(newType) && (!currentOptions || currentOptions.length === 0)) {
      updates.options = ['옵션 1', '옵션 2'];
    }

    updateFieldMultiple(groupId, fieldId, updates);
  }, [updateFieldMultiple]);

  // ============================================================================
  // 선택지 CRUD (RADIO 타입용)
  // ============================================================================

  /**
   * 선택지 추가
   */
  const addOption = useCallback((groupId: string, fieldId: string) => {
    onChange(
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            fields: g.fields.map((f) => {
              if (f.id === fieldId) {
                return {
                  ...f,
                  options: [...(f.options || []), ''],
                };
              }
              return f;
            }),
          };
        }
        return g;
      })
    );
  }, [groups, onChange]);

  /**
   * 선택지 업데이트
   */
  const updateOption = useCallback((
    groupId: string,
    fieldId: string,
    optionIndex: number,
    value: string
  ) => {
    onChange(
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            fields: g.fields.map((f) => {
              if (f.id === fieldId && f.options) {
                const newOptions = [...f.options];
                newOptions[optionIndex] = value;
                return { ...f, options: newOptions };
              }
              return f;
            }),
          };
        }
        return g;
      })
    );
  }, [groups, onChange]);

  /**
   * 선택지 삭제
   */
  const removeOption = useCallback((
    groupId: string,
    fieldId: string,
    optionIndex: number
  ) => {
    onChange(
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            fields: g.fields.map((f) => {
              if (f.id === fieldId && f.options) {
                const newOptions = [...f.options];
                newOptions.splice(optionIndex, 1);
                return { ...f, options: newOptions };
              }
              return f;
            }),
          };
        }
        return g;
      })
    );
  }, [groups, onChange]);

  return {
    // 그룹 관리
    addGroup,
    removeGroup,
    updateGroup,
    // 필드 관리
    addField,
    removeField,
    updateField,
    updateFieldMultiple,
    changeFieldType,
    // 선택지 관리
    addOption,
    updateOption,
    removeOption,
  };
}
