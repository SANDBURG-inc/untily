'use client';

import { useState, useCallback, useRef } from 'react';
import type { SubmitFormParams, ConfirmDialogData, UseFormSubmissionReturn } from './types';

/**
 * 폼 제출 로직 훅
 *
 * 폼 제출, 에러 처리, 충돌 확인 다이얼로그를 관리합니다.
 */
export function useFormSubmission(): UseFormSubmissionReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState<ConfirmDialogData | null>(null);

  // 강제 제출용 파라미터 저장
  const pendingSubmitRef = useRef<SubmitFormParams | null>(null);

  /**
   * 폼 제출 핵심 로직
   */
  const submitForm = useCallback(
    async (params: SubmitFormParams, force = false) => {
      const {
        mode,
        documentBoxId,
        documentName,
        description,
        logoUrl,
        logoFile,
        submittersEnabled,
        submitters,
        requirements,
        formFieldGroups,
        formFieldsAboveDocuments,
        deadline,
        reminderEnabled,
        emailReminder,
        smsReminder,
        kakaoReminder,
        reminderSchedules,
        changeStatusToOpen,
        uploadLogoFile,
        uploadTemplateFiles,
        onSuccess,
      } = params;

      const isEditMode = mode === 'edit';
      setError(null);
      setIsSubmitting(true);

      try {
        // 1. 로고 파일 업로드 (생성 모드, 첫 제출 시)
        let finalLogoUrl = logoUrl;
        if (!isEditMode && logoFile && !force && !logoUrl) {
          finalLogoUrl = await uploadLogoFile(logoFile);
        }

        // 2. 양식 파일 업로드
        const uploadedTemplates = await uploadTemplateFiles(
          requirements,
          isEditMode ? documentBoxId : undefined
        );

        // 3. requirements에 양식 정보 병합
        const requirementsWithTemplates = requirements.map((r) => {
          const uploaded = uploadedTemplates.get(r.id);
          if (uploaded && uploaded.length > 0) {
            return { ...r, templates: uploaded };
          }
          return { ...r, templates: r.templates?.filter((t) => t.s3Key) || [] };
        });

        // 4. API 호출
        const payload = {
          documentName,
          description,
          logoUrl: finalLogoUrl || null,
          submittersEnabled,
          submitters,
          requirements: requirementsWithTemplates,
          formFieldGroups,
          formFieldsAboveDocuments,
          deadline: deadline ? deadline.toISOString() : '',
          reminderEnabled,
          emailReminder,
          smsReminder,
          kakaoReminder,
          // 리마인드 스케줄 (ID 제외, API에서 새로 생성)
          reminderSchedules: reminderSchedules.map(({ id, ...rest }) => rest),
          force,
          // 수정 모드에서 기한 연장으로 다시 열기 확인 시 상태를 OPEN으로 변경
          ...(isEditMode && changeStatusToOpen && { changeStatusToOpen: true }),
        };

        const url = isEditMode ? `/api/document-box/${documentBoxId}` : '/api/document-box';
        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          // 충돌 처리 (제출 내역이 있는 항목 삭제 시도)
          if (data.code === 'CONFLICT_WITH_SUBMISSIONS') {
            pendingSubmitRef.current = params;
            setConfirmDialogData({
              submitters: data.conflictSubmitters || [],
              requirements: data.conflictRequirements || [],
            });
            setConfirmDialogOpen(true);
            setIsSubmitting(false);
            return;
          }

          throw new Error(
            data.error ||
              (isEditMode ? '문서함 수정에 실패했습니다' : '문서함 생성에 실패했습니다')
          );
        }

        // 5. 성공 콜백
        onSuccess(isEditMode ? documentBoxId : data.documentBoxId);
      } catch (err) {
        console.error(
          isEditMode ? 'Error updating document box:' : 'Error creating document box:',
          err
        );
        setError(
          err instanceof Error
            ? err.message
            : isEditMode
              ? '문서함 수정 중 오류가 발생했습니다'
              : '문서함 생성 중 오류가 발생했습니다'
        );
        setIsSubmitting(false);
      }
    },
    []
  );

  /**
   * 강제 삭제 확인 후 재제출
   */
  const handleForceSubmit = useCallback(() => {
    setConfirmDialogOpen(false);
    setConfirmDialogData(null);

    if (pendingSubmitRef.current) {
      submitForm(pendingSubmitRef.current, true);
      pendingSubmitRef.current = null;
    }
  }, [submitForm]);

  return {
    // 상태
    isSubmitting,
    error,
    confirmDialogOpen,
    confirmDialogData,
    // 액션
    setError,
    setConfirmDialogOpen,
    submitForm,
    handleForceSubmit,
  };
}
