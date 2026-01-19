'use client';

import { useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { LogoUploadDialog } from './LogoUploadDialog';
import {
  useDocumentBoxForm,
  type DocumentBoxInitialData,
} from '@/lib/hooks/document-box';
import type { TemplateFile } from '@/lib/types/document';

// 분리된 섹션 컴포넌트들
import { BasicInfoCard } from './document-registration/BasicInfoCard';
import { SubmitterRegistrationCard } from './document-registration/SubmitterRegistrationCard';
import { FormFieldGroupsCard } from './document-registration/FormFieldGroupsCard';
import { DocumentRequirementsCard } from './document-registration/DocumentRequirementsCard';
import { SubmissionSettingsCard } from './document-registration/SubmissionSettingsCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * DocumentRegistrationForm Props 인터페이스
 */
interface DocumentRegistrationFormProps {
  /** 폼 모드 (생성 또는 수정) */
  mode?: 'create' | 'edit';
  /** 수정 모드 시 문서함 ID */
  documentBoxId?: string;
  /** 수정 모드 시 초기 데이터 */
  initialData?: DocumentBoxInitialData;
}

/**
 * DocumentRegistrationForm 컴포넌트
 *
 * 문서함을 생성하거나 수정하는 폼 컴포넌트입니다.
 * 기본 정보, 제출자, 수집 서류, 제출 옵션 등을 설정할 수 있습니다.
 *
 * @example
 * ```tsx
 * // 생성 모드
 * <DocumentRegistrationForm mode="create" />
 *
 * // 수정 모드
 * <DocumentRegistrationForm
 *   mode="edit"
 *   documentBoxId="doc-123"
 *   initialData={existingData}
 * />
 * ```
 */
export default function DocumentRegistrationForm({
  mode = 'create',
  documentBoxId,
  initialData,
}: DocumentRegistrationFormProps) {
  // 모든 폼 상태와 핸들러를 Custom Hook으로 관리
  const form = useDocumentBoxForm({ mode, documentBoxId, initialData });

  // 양식 파일 미리보기 핸들러 (edit 모드에서만 사용)
  const handleTemplatePreview = useCallback(
    async (requirementId: string, template: TemplateFile) => {
      try {
        const params = new URLSearchParams({
          s3Key: template.s3Key,
          requiredDocumentId: requirementId,
        });
        const res = await fetch(`/api/template/preview?${params}`);

        if (!res.ok) {
          console.error('미리보기 URL 생성 실패');
          return;
        }

        const { previewUrl } = await res.json();
        window.open(previewUrl, '_blank');
      } catch (error) {
        console.error('양식 파일 미리보기 오류:', error);
      }
    },
    []
  );

  return (
    <>
      <form onSubmit={form.handleSubmit} className="max-w-3xl mx-auto">
        {/* 페이지 헤더 */}
        <PageHeader
          title={form.isEditMode ? '문서함 수정' : '문서함 등록'}
          description={
            form.isEditMode
              ? '문서함 정보를 수정하세요.'
              : '문서함 등록하고, 필요한 서류를 쉽게 취합해보세요!'
          }
          align="center"
        />

        {/* 에러 메시지 */}
        {form.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{form.error}</p>
          </div>
        )}

        {/* 로고 업로드 다이얼로그 */}
        <LogoUploadDialog
          open={form.logoDialogOpen}
          onOpenChange={form.setLogoDialogOpen}
          type="documentBox"
          documentBoxId={form.isEditMode ? documentBoxId : undefined}
          existingLogoUrl={
            form.isEditMode ? form.logoUrl || undefined : form.logoPreviewUrl || undefined
          }
          onUploadComplete={(url) => form.setLogoUrl(url)}
          onFileSelect={
            !form.isEditMode
              ? (file, previewUrl) => form.handleLogoSelect(file, previewUrl)
              : undefined
          }
        />

        {/* 통합 Card - 모든 섹션을 하나의 Card로 묶음 */}
        <Card variant="compact" className="mb-8">
          {/* 기본 정보 섹션 */}
          <div className="px-6 pt-6 pb-6">
            <BasicInfoCard
              documentName={form.documentName}
              onDocumentNameChange={form.setDocumentName}
              description={form.description}
              onDescriptionChange={form.setDescription}
              logoUrl={form.effectiveLogoUrl}
              onLogoRemove={form.handleLogoRemove}
              onLogoDialogOpen={() => form.setLogoDialogOpen(true)}
            />
          </div>

          <div className="mx-6 border-t border-gray-200 rounded-full" />

          {/* 서류 제출자 섹션 */}
          <div className="px-6 py-6">
            <SubmitterRegistrationCard
              submittersEnabled={form.submittersEnabled}
              onSubmittersEnabledChange={form.handleSubmittersEnabledChange}
              submitters={form.submitters}
              onSubmittersChange={form.setSubmitters}
              isEditMode={form.isEditMode}
            />
          </div>

          <div className="mx-6 border-t border-gray-200 rounded-full" />

          {/* 정보 입력 항목 섹션 */}
          <div className="px-6 py-6">
            <FormFieldGroupsCard
              formFieldGroups={form.formFieldGroups}
              onFormFieldGroupsChange={form.setFormFieldGroups}
              formFieldsAboveDocuments={form.formFieldsAboveDocuments}
              onFormFieldsAboveDocumentsChange={form.setFormFieldsAboveDocuments}
            />
          </div>

          <div className="mx-6 border-t border-gray-200 rounded-full" />

          {/* 수집 서류 섹션 */}
          <div className="px-6 py-6">
            <DocumentRequirementsCard
              requirements={form.requirements}
              onRequirementsChange={form.setRequirements}
              onTemplateFileSelect={form.handleTemplateFileSelect}
              onTemplateFileRemove={form.handleTemplateFileRemove}
              uploadingTemplateIds={form.uploadingTemplateIds}
              onTemplatePreview={form.isEditMode ? handleTemplatePreview : undefined}
            />
          </div>

          <div className="mx-6 border-t border-gray-200 rounded-full" />

          {/* 제출 옵션 섹션 */}
          <div className="px-6 pt-6 pb-6">
            <SubmissionSettingsCard
              deadline={form.deadline}
              onDeadlineChange={form.setDeadline}
              reminderEnabled={form.reminderEnabled}
              onReminderEnabledChange={form.setReminderEnabled}
              emailReminder={form.emailReminder}
              onEmailReminderChange={form.setEmailReminder}
              submittersEnabled={form.submittersEnabled}
              documentBoxStatus={form.documentBoxStatus}
              initialDeadline={form.initialDeadline}
              onReopenConfirmed={form.setReopenConfirmed}
            />
          </div>
        </Card>

        {/* 하단 액션 버튼 */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="soft"
            size="lg"
            onClick={form.handleCancel}
            disabled={form.isSubmitting}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={form.isSubmitting}
            className="flex-1"
          >
            {form.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {form.isSubmitting
              ? form.isEditMode
                ? '수정 중...'
                : '생성 중...'
              : form.isEditMode
                ? '수정완료'
                : '문서함 생성'}
          </Button>
        </div>
      </form>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={form.confirmDialogOpen} onOpenChange={form.setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이미 제출된 내역이 있습니다. 삭제하시겠습니까?</DialogTitle>
            <DialogDescription>
              {(form.confirmDialogData?.submitters?.length || 0) > 0 && (
                <span>
                  제출 내역이 있는 사용자:{' '}
                  <strong>{form.confirmDialogData?.submitters.join(', ')}</strong>
                  <br />
                </span>
              )}
              {(form.confirmDialogData?.requirements?.length || 0) > 0 && (
                <span className="mt-2 inline-block">
                  제출 내역이 있는 문서:{' '}
                  <strong>{form.confirmDialogData?.requirements.join(', ')}</strong>
                  <br />
                </span>
              )}
              <br />
              삭제 시 해당 항목의 모든 제출 데이터가 영구적으로 삭제됩니다. 계속하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => form.setConfirmDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={form.handleForceDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
