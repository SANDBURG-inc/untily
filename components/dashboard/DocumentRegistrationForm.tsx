'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { Loader2, FileText, Users, FileEdit, Settings, Eye, ChevronDown } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { LogoUploadDialog } from './LogoUploadDialog';
import { CollapsibleSection } from '@/components/shared/CollapsibleSection';
import {
  useDocumentBoxForm,
  type DocumentBoxInitialData,
} from '@/lib/hooks/document-box';
import type { TemplateFile } from '@/lib/types/document';
import { cn } from '@/lib/utils';

// 분리된 섹션 컴포넌트들
import { BasicInfoCard } from './document-registration/BasicInfoCard';
import { SubmitterRegistrationCard } from './document-registration/SubmitterRegistrationCard';
import { QuestionsCard } from './document-registration/QuestionsCard';
import { DocumentRequirementsCard } from './document-registration/DocumentRequirementsCard';
import { SubmissionSettingsCard } from './document-registration/SubmissionSettingsCard';
import { SubmitPreviewSheet, type PreviewView } from './document-registration/SubmitPreviewSheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * 섹션 ID 타입
 */
type SectionId = 'basicInfo' | 'submitters' | 'formFields' | 'requirements' | 'settings';

/**
 * 섹션 정보 (Sticky Header용)
 */
const SECTION_INFO: Record<SectionId, { title: string; icon: React.ComponentType<{ className?: string }> }> = {
  basicInfo: { title: '기본정보', icon: FileText },
  submitters: { title: '서류 제출자 등록', icon: Users },
  formFields: { title: '사용자 입력 폼', icon: FileEdit },
  requirements: { title: '수집 서류 등록', icon: FileText },
  settings: { title: '제출 옵션 설정', icon: Settings },
};

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
  /** 사용자 기본 로고 URL (문서함 로고가 없을 때 fallback) */
  userDefaultLogoUrl?: string;
}

/**
 * DocumentRegistrationForm 컴포넌트
 *
 * 문서함을 생성하거나 수정하는 폼 컴포넌트입니다.
 * 기본 정보, 제출자, 수집 서류, 제출 옵션 등을 설정할 수 있습니다.
 * 각 섹션은 접기/펼치기가 가능하며, 모드에 따라 초기 상태가 다릅니다.
 *
 * @example
 * ```tsx
 * // 생성 모드 (모든 섹션 펼침)
 * <DocumentRegistrationForm mode="create" />
 *
 * // 수정 모드 (모든 섹션 접힘)
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
  userDefaultLogoUrl,
}: DocumentRegistrationFormProps) {
  // 모든 폼 상태와 핸들러를 Custom Hook으로 관리
  const form = useDocumentBoxForm({ mode, documentBoxId, initialData, userDefaultLogoUrl });

  // 섹션별 열림/닫힘 상태 (등록: 모두 열림, 수정: 모두 닫힘)
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>(() => ({
    basicInfo: mode === 'create',
    submitters: mode === 'create',
    formFields: mode === 'create',
    requirements: mode === 'create',
    settings: mode === 'create',
  }));

  // 제출화면 미리보기 Sheet 열림 상태
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);

  // 미리보기에서 마지막으로 본 화면 상태 (Sheet 재열림 시 유지)
  const [lastPreviewView, setLastPreviewView] = useState<PreviewView>('landing');

  // Sticky Header 상태
  const [currentStickySection, setCurrentStickySection] = useState<SectionId | null>(null);
  const sectionRefs = useRef<Record<SectionId, HTMLDivElement | null>>({
    basicInfo: null,
    submitters: null,
    formFields: null,
    requirements: null,
    settings: null,
  });

  // 섹션 토글 핸들러
  const toggleSection = useCallback((sectionId: SectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  // Sticky Header 스크롤 감지 (펼쳐진 섹션만)
  useEffect(() => {
    const handleScroll = () => {
      const sectionIds: SectionId[] = ['basicInfo', 'submitters', 'formFields', 'requirements', 'settings'];
      let activeStickySection: SectionId | null = null;

      for (const sectionId of sectionIds) {
        // 펼쳐진 섹션만 sticky header 대상
        if (!openSections[sectionId]) continue;

        const element = sectionRefs.current[sectionId];
        if (element) {
          const rect = element.getBoundingClientRect();
          // 섹션 상단이 화면 상단(60px) 위로 벗어났고, 섹션 하단이 아직 화면 안에 있는 경우
          if (rect.top < 60 && rect.bottom > 100) {
            activeStickySection = sectionId;
          }
        }
      }

      setCurrentStickySection(activeStickySection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 초기 상태 설정

    return () => window.removeEventListener('scroll', handleScroll);
  }, [openSections]);

  // 섹션으로 스크롤 이동
  const scrollToSection = useCallback((sectionId: SectionId) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      const offset = 70; // sticky header 높이
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  }, []);

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

  // Sticky Header에 표시할 섹션 정보
  const stickyInfo = currentStickySection ? SECTION_INFO[currentStickySection] : null;
  const StickyIcon = stickyInfo?.icon;

  return (
    <>
      {/* Sticky Section Header - 스크롤 시 현재 섹션 표시 (기존 SectionHeader 디자인) */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm transition-all duration-200',
          currentStickySection ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        )}
      >
        <div className="max-w-3xl mx-auto px-6 py-4">
          <button
            type="button"
            onClick={() => currentStickySection && toggleSection(currentStickySection)}
            className="flex items-center gap-2 text-left group hover:opacity-80 transition-opacity"
          >
            {/* Chevron 아이콘 (열림/닫힘 상태 표시) */}
            <ChevronDown className="w-5 h-5 text-gray-400" />
            {StickyIcon && <StickyIcon className="w-5 h-5 text-gray-700" />}
            <span className="text-lg font-semibold text-gray-900">{stickyInfo?.title}</span>
          </button>
        </div>
      </div>

      <form onSubmit={form.handleSubmit} className="max-w-3xl mx-auto pb-24">
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
          <div
            ref={(el) => { sectionRefs.current.basicInfo = el; }}
            className="px-6 pt-6 pb-6"
          >
            <CollapsibleSection
              title="기본정보"
              icon={FileText}
              size="md"
              isOpen={openSections.basicInfo}
              onToggle={() => toggleSection('basicInfo')}
            >
              <BasicInfoCard
                documentName={form.documentName}
                onDocumentNameChange={form.setDocumentName}
                description={form.description}
                onDescriptionChange={form.setDescription}
                logoUrl={form.effectiveLogoUrl}
                hasCustomLogo={!!(form.logoUrl || form.logoPreviewUrl)}
                onLogoRemove={form.handleLogoRemove}
                onLogoDialogOpen={() => form.setLogoDialogOpen(true)}
              />
            </CollapsibleSection>
          </div>

          <div className="mx-6 border-t border-gray-200 rounded-full" />

          {/* 서류 제출자 섹션 */}
          <div
            ref={(el) => { sectionRefs.current.submitters = el; }}
            className="px-6 py-6"
          >
            <CollapsibleSection
              title="서류 제출자 등록"
              icon={Users}
              size="md"
              isOpen={openSections.submitters}
              onToggle={() => toggleSection('submitters')}
              tooltip={"등록된 이메일로만 제출 가능합니다.\n미등록 시 링크를 받은 누구나 제출할 수 있습니다."}
              rightAction={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Switch
                        checked={form.submittersEnabled}
                        onCheckedChange={form.handleSubmittersEnabledChange}
                        disabled={form.isEditMode}
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p className="text-xs">
                      {form.isEditMode
                        ? '한번 등록된 제출자 설정은 변경할 수 없습니다.'
                        : '활성화 시 등록된 이메일로만 제출 가능합니다.\n생성 후에는 변경할 수 없습니다.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              }
            >
              <SubmitterRegistrationCard
                submittersEnabled={form.submittersEnabled}
                submitters={form.submitters}
                onSubmittersChange={form.setSubmitters}
              />
            </CollapsibleSection>
          </div>

          <div className="mx-6 border-t border-gray-200 rounded-full" />

          {/* 사용자 입력 폼 섹션 */}
          <div
            ref={(el) => { sectionRefs.current.formFields = el; }}
            className="px-6 py-6"
          >
            <CollapsibleSection
              title="사용자 입력 폼"
              icon={FileEdit}
              size="md"
              isOpen={openSections.formFields}
              onToggle={() => toggleSection('formFields')}
              tooltip="제출자가 직접 입력하거나 선택할 수 있는 폼을 생성합니다."
            >
              <QuestionsCard
                questions={form.questions}
                onQuestionsChange={form.setQuestions}
                formFieldsAboveDocuments={form.formFieldsAboveDocuments}
                onFormFieldsAboveDocumentsChange={form.setFormFieldsAboveDocuments}
              />
            </CollapsibleSection>
          </div>

          <div className="mx-6 border-t border-gray-200 rounded-full" />

          {/* 수집 서류 섹션 */}
          <div
            ref={(el) => { sectionRefs.current.requirements = el; }}
            className="px-6 py-6"
          >
            <CollapsibleSection
              title="수집 서류 등록"
              icon={FileText}
              size="md"
              isOpen={openSections.requirements}
              onToggle={() => toggleSection('requirements')}
            >
              <DocumentRequirementsCard
                requirements={form.requirements}
                onRequirementsChange={form.setRequirements}
                onTemplateFileSelect={form.handleTemplateFileSelect}
                onTemplateFileRemove={form.handleTemplateFileRemove}
                uploadingTemplateIds={form.uploadingTemplateIds}
                onTemplatePreview={form.isEditMode ? handleTemplatePreview : undefined}
              />
            </CollapsibleSection>
          </div>

          <div className="mx-6 border-t border-gray-200 rounded-full" />

          {/* 제출 옵션 섹션 */}
          <div
            ref={(el) => { sectionRefs.current.settings = el; }}
            className="px-6 pt-6 pb-6"
          >
            <CollapsibleSection
              title="제출 옵션 설정"
              icon={Settings}
              size="md"
              isOpen={openSections.settings}
              onToggle={() => toggleSection('settings')}
            >
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
                reminderSchedules={form.reminderSchedules}
                onReminderSchedulesChange={form.setReminderSchedules}
              />
            </CollapsibleSection>
          </div>
        </Card>

      </form>

      {/* 하단 액션 버튼 - Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="soft"
              size="lg"
              onClick={() => setPreviewSheetOpen(true)}
              disabled={form.isSubmitting}
              className="flex-1"
            >
              <Eye className="w-4 h-4" />
              제출화면 미리보기
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={form.isSubmitting}
              className="flex-1"
              onClick={form.handleSubmit}
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
        </div>
      </div>

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

      {/* 제출화면 미리보기 Sheet */}
      <SubmitPreviewSheet
        open={previewSheetOpen}
        onOpenChange={setPreviewSheetOpen}
        documentBoxTitle={form.documentName}
        documentBoxDescription={form.description}
        logoUrl={form.effectiveLogoUrl}
        requirements={form.requirements.map((req) => ({
          requiredDocumentId: req.id,
          documentTitle: req.name,
          documentDescription: req.description,
          isRequired: req.type === '필수',
          allowMultipleFiles: req.allowMultiple,
        }))}
        formFieldGroups={form.formFieldGroups.map((group) => ({
          id: group.id,
          groupTitle: group.groupTitle,
          groupDescription: group.groupDescription,
          isRequired: group.isRequired,
          order: group.order,
          fields: group.fields.map((field) => ({
            id: field.id,
            fieldLabel: field.fieldLabel,
            fieldType: field.fieldType,
            placeholder: field.placeholder,
            isRequired: field.isRequired,
            order: field.order,
            options: field.options,
            hasOtherOption: field.hasOtherOption,
            validation: field.validation,
          })),
        }))}
        formFieldsAboveDocuments={form.formFieldsAboveDocuments}
        initialView={lastPreviewView}
        onViewChange={setLastPreviewView}
      />
    </>
  );
}
