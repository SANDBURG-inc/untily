'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { uploadToS3 } from '@/lib/s3/upload';
import type { UseDocumentBoxFormOptions, UseDocumentBoxFormReturn, TemplateFile } from './types';

import { useBasicInfo } from './useBasicInfo';
import { useTemplateFiles } from './useTemplateFiles';
import { useSubmitters } from './useSubmitters';
import { useRequirements } from './useRequirements';
import { useFormFieldGroups } from './useFormFieldGroups';
import { useSubmissionSettings } from './useSubmissionSettings';
import { useFormSubmission } from './useFormSubmission';

/**
 * 문서함 폼 통합 관리 훅
 *
 * 모든 서브 훅을 조합하여 문서함 생성/수정 폼의 상태와 핸들러를 제공합니다.
 *
 * @example
 * ```tsx
 * const form = useDocumentBoxForm({ mode: 'create' });
 *
 * return (
 *   <form onSubmit={form.handleSubmit}>
 *     <input value={form.documentName} onChange={(e) => form.setDocumentName(e.target.value)} />
 *   </form>
 * );
 * ```
 */
export function useDocumentBoxForm(
  options: UseDocumentBoxFormOptions
): UseDocumentBoxFormReturn {
  const { mode, documentBoxId, initialData } = options;
  const router = useRouter();
  const isEditMode = mode === 'edit';

  // === 서브 훅 조합 ===
  const basicInfo = useBasicInfo({ initialData });
  const templateFilesHook = useTemplateFiles();
  const submittersHook = useSubmitters({ initialData });
  const requirementsHook = useRequirements({ initialData });
  const formFieldGroupsHook = useFormFieldGroups({ initialData });
  const submissionSettings = useSubmissionSettings({ initialData });
  const formSubmission = useFormSubmission();

  // 다시 열기 확인 상태 (기한 연장으로 닫힌 문서함을 다시 열 때)
  const [reopenConfirmed, setReopenConfirmed] = useState(false);

  // 초기 마감일 (수정 모드에서 기한 연장 감지용)
  const initialDeadline = initialData?.deadline
    ? new Date(initialData.deadline)
    : undefined;

  // === 파생 상태 ===
  const effectiveLogoUrl = isEditMode
    ? basicInfo.logoUrl
    : basicInfo.logoPreviewUrl || basicInfo.logoUrl;

  // === 통합 핸들러 ===

  /**
   * 양식 파일 선택 시 requirements 상태도 동기화
   */
  const handleTemplateFileSelect = useCallback(
    (requirementId: string, file: File) => {
      templateFilesHook.handleTemplateFileSelect(requirementId, file);

      // requirements에 임시 파일명 추가 (미리보기용)
      requirementsHook.addTemplateToRequirement(requirementId, {
        s3Key: '', // 업로드 전이므로 빈 값
        filename: file.name,
      });
    },
    [templateFilesHook, requirementsHook]
  );

  /**
   * 양식 파일 삭제 시 양쪽 상태 동기화
   */
  const handleTemplateFileRemove = useCallback(
    (requirementId: string, index: number) => {
      templateFilesHook.handleTemplateFileRemove(requirementId, index);
      requirementsHook.removeTemplateFromRequirement(requirementId, index);
    },
    [templateFilesHook, requirementsHook]
  );

  /**
   * 제출자 활성화 변경 시 리마인드 연동
   */
  const handleSubmittersEnabledChange = useCallback(
    (enabled: boolean) => {
      submittersHook.handleSubmittersEnabledChange(enabled, () => {
        submissionSettings.setReminderEnabled(false);
      });
    },
    [submittersHook, submissionSettings]
  );

  /**
   * 로고 업로드 헬퍼
   */
  const uploadLogoFile = useCallback(async (file: File): Promise<string> => {
    const presignedRes = await fetch('/api/logo/presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'image/jpeg',
        size: file.size,
        type: 'documentBox',
      }),
    });

    if (!presignedRes.ok) {
      const errorData = await presignedRes.json();
      throw new Error(errorData.error || '로고 업로드 URL 생성에 실패했습니다.');
    }

    const { uploadUrl, fileUrl } = await presignedRes.json();
    await uploadToS3({ uploadUrl, file });
    return fileUrl;
  }, []);

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      await formSubmission.submitForm({
        mode,
        documentBoxId,
        documentName: basicInfo.documentName,
        description: basicInfo.description,
        logoUrl: basicInfo.logoUrl,
        logoFile: basicInfo.logoFile,
        submittersEnabled: submittersHook.submittersEnabled,
        submitters: submittersHook.submitters,
        requirements: requirementsHook.requirements,
        formFieldGroups: formFieldGroupsHook.formFieldGroups,
        formFieldsAboveDocuments: formFieldGroupsHook.formFieldsAboveDocuments,
        deadline: submissionSettings.deadline,
        reminderEnabled: submissionSettings.reminderEnabled,
        emailReminder: submissionSettings.emailReminder,
        smsReminder: submissionSettings.smsReminder,
        kakaoReminder: submissionSettings.kakaoReminder,
        // 기한 연장으로 다시 열기 확인된 경우 상태를 OPEN으로 변경
        changeStatusToOpen: reopenConfirmed,
        uploadLogoFile,
        uploadTemplateFiles: (reqs, boxId) =>
          templateFilesHook.uploadTemplateFiles(reqs, boxId) as Promise<
            Map<string, TemplateFile[]>
          >,
        onSuccess: () => {
          if (isEditMode && documentBoxId) {
            router.push(`/dashboard/${documentBoxId}`);
          } else {
            router.push('/dashboard');
          }
        },
      });
    },
    [
      mode,
      documentBoxId,
      basicInfo,
      submittersHook,
      requirementsHook,
      formFieldGroupsHook,
      submissionSettings,
      formSubmission,
      reopenConfirmed,
      uploadLogoFile,
      templateFilesHook,
      isEditMode,
      router,
    ]
  );

  /**
   * 강제 삭제 확인 핸들러
   */
  const handleForceDelete = useCallback(async () => {
    formSubmission.handleForceSubmit();
  }, [formSubmission]);

  /**
   * 취소 핸들러
   */
  const handleCancel = useCallback(() => {
    if (isEditMode && documentBoxId) {
      router.push(`/dashboard/${documentBoxId}`);
    } else {
      router.push('/dashboard');
    }
  }, [isEditMode, documentBoxId, router]);

  // === 반환 ===
  return {
    // 기본 정보
    documentName: basicInfo.documentName,
    description: basicInfo.description,
    logoUrl: basicInfo.logoUrl,
    logoFile: basicInfo.logoFile,
    logoPreviewUrl: basicInfo.logoPreviewUrl,
    logoDialogOpen: basicInfo.logoDialogOpen,
    setDocumentName: basicInfo.setDocumentName,
    setDescription: basicInfo.setDescription,
    setLogoUrl: basicInfo.setLogoUrl,
    setLogoDialogOpen: basicInfo.setLogoDialogOpen,
    handleLogoRemove: basicInfo.handleLogoRemove,
    handleLogoSelect: basicInfo.handleLogoSelect,

    // 양식 파일
    templateFiles: templateFilesHook.templateFiles,
    uploadingTemplateIds: templateFilesHook.uploadingTemplateIds,
    handleTemplateFileSelect,
    handleTemplateFileRemove,

    // 제출자
    submittersEnabled: submittersHook.submittersEnabled,
    submitters: submittersHook.submitters,
    setSubmittersEnabled: submittersHook.setSubmittersEnabled,
    setSubmitters: submittersHook.setSubmitters,
    handleSubmittersEnabledChange,

    // 서류 요구사항
    requirements: requirementsHook.requirements,
    setRequirements: requirementsHook.setRequirements,

    // 폼 필드 (질문)
    questions: formFieldGroupsHook.questions,
    setQuestions: formFieldGroupsHook.setQuestions,
    // 기존 formFieldGroups (API 호환성)
    formFieldGroups: formFieldGroupsHook.formFieldGroups,
    formFieldsAboveDocuments: formFieldGroupsHook.formFieldsAboveDocuments,
    setFormFieldGroups: formFieldGroupsHook.setFormFieldGroups,
    setFormFieldsAboveDocuments: formFieldGroupsHook.setFormFieldsAboveDocuments,

    // 제출 설정
    deadline: submissionSettings.deadline,
    reminderEnabled: submissionSettings.reminderEnabled,
    emailReminder: submissionSettings.emailReminder,
    smsReminder: submissionSettings.smsReminder,
    kakaoReminder: submissionSettings.kakaoReminder,
    setDeadline: submissionSettings.setDeadline,
    setReminderEnabled: submissionSettings.setReminderEnabled,
    setEmailReminder: submissionSettings.setEmailReminder,

    // 다시 열기 관련 (기한 연장으로 닫힌 문서함을 다시 열 때)
    documentBoxStatus: initialData?.status,
    initialDeadline,
    reopenConfirmed,
    setReopenConfirmed,

    // 폼 제출
    isSubmitting: formSubmission.isSubmitting,
    error: formSubmission.error,
    confirmDialogOpen: formSubmission.confirmDialogOpen,
    confirmDialogData: formSubmission.confirmDialogData,
    setError: formSubmission.setError,
    setConfirmDialogOpen: formSubmission.setConfirmDialogOpen,
    handleForceSubmit: formSubmission.handleForceSubmit,

    // 폼 핸들러
    handleSubmit,
    handleForceDelete,
    handleCancel,

    // 유틸리티
    isEditMode,
    effectiveLogoUrl,
  };
}
