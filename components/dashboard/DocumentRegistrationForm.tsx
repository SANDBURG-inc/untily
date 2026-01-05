'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Submitter, DocumentRequirement } from '@/lib/types/document';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { LogoUploadDialog } from './LogoUploadDialog';
import { uploadToS3 } from '@/lib/s3/upload';

// 분리된 카드 컴포넌트들
import { BasicInfoCard } from './document-registration/BasicInfoCard';
import { SubmitterRegistrationCard } from './document-registration/SubmitterRegistrationCard';
import { DocumentRequirementsCard } from './document-registration/DocumentRequirementsCard';
import { SubmissionSettingsCard } from './document-registration/SubmissionSettingsCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * 문서함 초기 데이터 인터페이스
 */
interface DocumentBoxInitialData {
  documentName: string;
  description: string;
  logoUrl?: string;
  submittersEnabled: boolean;
  submitters: Submitter[];
  requirements: DocumentRequirement[];
  deadline: string;
  reminderEnabled: boolean;
  emailReminder: boolean;
  smsReminder: boolean;
  kakaoReminder: boolean;
}

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
  const router = useRouter();
  const isEditMode = mode === 'edit';

  // ===== 기본 정보 상태 =====
  const [documentName, setDocumentName] = useState(initialData?.documentName || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || '');
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  // 생성 모드에서 로고 파일을 임시 저장 (폼 제출 시 업로드)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  // ===== 제출자 등록 상태 =====
  const [submittersEnabled, setSubmittersEnabled] = useState(
    initialData?.submittersEnabled ?? true
  );
  const [submitters, setSubmitters] = useState<Submitter[]>(
    initialData?.submitters || [{ id: '1', name: '', email: '', phone: '' }]
  );

  // ===== 수집 서류 상태 =====
  const [requirements, setRequirements] = useState<DocumentRequirement[]>(
    initialData?.requirements || [{ id: '1', name: '', type: '필수', description: '' }]
  );

  // ===== 제출 옵션 상태 =====
  // deadline: API에서는 문자열(YYYY-MM-DD)로 전달하지만, DatePicker는 Date 객체를 사용
  const [deadline, setDeadline] = useState<Date | undefined>(
    initialData?.deadline ? parseISO(initialData.deadline) : undefined
  );
  const [reminderEnabled, setReminderEnabled] = useState(
    initialData?.reminderEnabled ?? true
  );
  const [emailReminder, setEmailReminder] = useState(initialData?.emailReminder ?? true);
  // smsReminder, kakaoReminder는 현재 미지원 (추후 업데이트 예정)
  const [smsReminder] = useState(false);
  const [kakaoReminder] = useState(false);

  // ===== UI 상태 =====
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // ===== 삭제 확인 다이얼로그 상태 =====
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState<{
    submitters: string[];
    requirements: string[];
  } | null>(null);

  /**
   * 제출자 기능 활성화/비활성화 핸들러
   * 비활성화 시 리마인드 기능도 함께 비활성화
   */
  const handleSubmittersEnabledChange = (enabled: boolean) => {
    setSubmittersEnabled(enabled);
    if (!enabled) {
      setReminderEnabled(false);
    }
  };

  /**
   * 로고 파일 업로드 헬퍼 함수
   * 생성 모드에서 로고 파일이 있을 때 S3에 업로드하고 URL 반환
   */
  const uploadLogoFile = async (file: File): Promise<string> => {
    // 1. Presigned URL 요청
    const presignedRes = await fetch('/api/logo/presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'image/jpeg',
        size: file.size,
        type: 'documentBox',
        // 생성 모드에서는 documentBoxId가 없음
      }),
    });

    if (!presignedRes.ok) {
      const errorData = await presignedRes.json();
      throw new Error(errorData.error || '로고 업로드 URL 생성에 실패했습니다.');
    }

    const { uploadUrl, fileUrl } = await presignedRes.json();

    // 2. S3에 업로드
    await uploadToS3({
      uploadUrl,
      file,
    });

    return fileUrl;
  };

  /**
   * 폼 제출 핸들러 (내부 구현)
   */
  const submitForm = async (force: boolean = false) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // 생성 모드에서 로고 파일이 있으면 먼저 업로드 (force일 때는 이미 업로드된 logoUrl 사용)
      let finalLogoUrl = logoUrl;
      if (!isEditMode && logoFile && !force && !logoUrl) {
        finalLogoUrl = await uploadLogoFile(logoFile);
      }

      const payload = {
        documentName,
        description,
        logoUrl: finalLogoUrl || null,
        submittersEnabled,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        submitters: submitters.map(({ ...rest }) => rest), // id 포함해서 전송
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        requirements: requirements,
        // Date 객체를 YYYY-MM-DD 문자열로 변환하여 API에 전달
        deadline: deadline ? format(deadline, 'yyyy-MM-dd') : '',
        reminderEnabled,
        emailReminder,
        smsReminder,
        kakaoReminder,
        force, // 강제 수정 여부
      };

      const url = isEditMode ? `/api/document-box/${documentBoxId}` : '/api/document-box';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // 제출 내역이 있는 항목 삭제 시도 에러 처리 (409 Conflict)
        if (data.code === 'CONFLICT_WITH_SUBMISSIONS') {
            setConfirmDialogData({
                submitters: data.conflictSubmitters || [],
                requirements: data.conflictRequirements || []
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

      // 성공 시 대시보드 또는 상세 페이지로 이동
      if (isEditMode && documentBoxId) {
        router.push(`/dashboard/${documentBoxId}`);
      } else {
        router.push('/dashboard');
      }
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
  };

  /**
   * 폼 제출 핸들러 (이벤트)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm(false);
  };

  /**
   * 강제 삭제 확인 핸들러
   */
  const handleForceDelete = async () => {
    setConfirmDialogOpen(false);
    setConfirmDialogData(null);
    await submitForm(true);
  };

  /**
   * 취소 버튼 핸들러
   */
  const handleCancel = () => {
    if (isEditMode && documentBoxId) {
      router.push(`/dashboard/${documentBoxId}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      {/* 페이지 헤더 */}
      <PageHeader
        title={isEditMode ? '문서함 수정' : '문서함 등록'}
        description={
          isEditMode
            ? '문서함 정보를 수정하세요.'
            : '문서함 등록하고, 필요한 서류를 쉽게 취합해보세요!'
        }
        align="center"
      />

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 기본 정보 입력 카드 */}
      <BasicInfoCard
        documentName={documentName}
        onDocumentNameChange={setDocumentName}
        description={description}
        onDescriptionChange={setDescription}
        logoUrl={isEditMode ? logoUrl : (logoPreviewUrl || logoUrl)}
        onLogoRemove={() => {
          setLogoUrl('');
          setLogoFile(null);
          setLogoPreviewUrl(null);
        }}
        onLogoDialogOpen={() => setLogoDialogOpen(true)}
      />

      {/* 로고 업로드 다이얼로그 */}
      <LogoUploadDialog
        open={logoDialogOpen}
        onOpenChange={setLogoDialogOpen}
        type="documentBox"
        documentBoxId={isEditMode ? documentBoxId : undefined}
        existingLogoUrl={isEditMode ? (logoUrl || undefined) : (logoPreviewUrl || undefined)}
        onUploadComplete={(url) => setLogoUrl(url)}
        // 생성 모드에서는 지연 업로드 (파일 선택만 하고 폼 제출 시 업로드)
        onFileSelect={
          !isEditMode
            ? (file, previewUrl) => {
                setLogoFile(file);
                setLogoPreviewUrl(previewUrl);
              }
            : undefined
        }
      />

      {/* 서류 제출자 등록 카드 */}
      <SubmitterRegistrationCard
        submittersEnabled={submittersEnabled}
        onSubmittersEnabledChange={handleSubmittersEnabledChange}
        submitters={submitters}
        onSubmittersChange={setSubmitters}
        isEditMode={isEditMode}
      />

      {/* 수집 서류 등록 카드 */}
      <DocumentRequirementsCard
        requirements={requirements}
        onRequirementsChange={setRequirements}
      />

      {/* 제출 옵션 설정 카드 */}
      <SubmissionSettingsCard
        deadline={deadline}
        onDeadlineChange={setDeadline}
        reminderEnabled={reminderEnabled}
        onReminderEnabledChange={setReminderEnabled}
        emailReminder={emailReminder}
        onEmailReminderChange={setEmailReminder}
        submittersEnabled={submittersEnabled}
      />

      {/* 하단 액션 버튼 */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="soft"
          size="lg"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          취소
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting
            ? isEditMode
              ? '수정 중...'
              : '생성 중...'
            : isEditMode
              ? '수정완료'
              : '문서함 생성'}
        </Button>
      </div>
    </form>
    
    {/* 삭제 확인 다이얼로그 */}
    <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    이미 제출된 내역이 있습니다. 삭제하시겠습니까?
                </DialogTitle>
                <DialogDescription>
                    {(confirmDialogData?.submitters?.length || 0) > 0 && (
                        <span>
                            제출 내역이 있는 사용자: <strong>{confirmDialogData?.submitters.join(', ')}</strong><br />
                        </span>
                    )}
                    {(confirmDialogData?.requirements?.length || 0) > 0 && (
                        <span className="mt-2 inline-block">
                            제출 내역이 있는 문서: <strong>{confirmDialogData?.requirements.join(', ')}</strong><br />
                        </span>
                    )}
                    <br/>
                    삭제 시 해당 항목의 모든 제출 데이터가 영구적으로 삭제됩니다. 계속하시겠습니까?
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setConfirmDialogOpen(false)}>취소</Button>
                <Button variant="destructive" onClick={handleForceDelete}>삭제</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
