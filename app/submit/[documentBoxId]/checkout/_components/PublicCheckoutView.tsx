'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { SubmitActionFooter } from '@/app/submit/_components';
import InfoCard from '@/app/submit/[documentBoxId]/[submitterId]/checkout/_components/InfoCard';
import SubmitterInfoCard from './SubmitterInfoCard';
import EditableFileListCard from './EditableFileListCard';
import ProfileUpdateDialog from './ProfileUpdateDialog';
import type { UploadedDocument } from '@/components/submit/upload/DocumentUploadItem';

interface RequiredDocument {
  requiredDocumentId: string;
  documentTitle: string;
  documentDescription: string | null;
  isRequired: boolean;
}

interface SubmittedDocument {
  submittedDocumentId: string;
  requiredDocumentId: string;
  filename: string;
  originalFilename: string;
  size?: number;
}

interface UserProfile {
  name: string | null;
  phone: string | null;
}

interface PublicCheckoutViewProps {
  documentBox: {
    boxTitle: string;
    requiredDocuments: RequiredDocument[];
  };
  submitter: {
    name: string;
    email: string;
    phone: string;
    submitterId: string;
    submittedDocuments: SubmittedDocument[];
  };
  userProfile: UserProfile | null;
  documentBoxId: string;
}

export default function PublicCheckoutView({
  documentBox,
  submitter: initialSubmitter,
  userProfile,
  documentBoxId,
}: PublicCheckoutViewProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitterInfo, setSubmitterInfo] = useState({
    name: initialSubmitter.name,
    email: initialSubmitter.email,
    phone: initialSubmitter.phone,
  });

  // 프로필 업데이트 Dialog 상태
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [pendingProfileUpdate, setPendingProfileUpdate] = useState<{
    name?: string;
    phone?: string;
  } | null>(null);

  // 업로드된 파일을 requiredDocument 기준으로 매핑 (복수 파일 지원)
  const [uploadedFilesMap, setUploadedFilesMap] = useState(() => {
    const map = new Map<string, SubmittedDocument[]>();
    initialSubmitter.submittedDocuments.forEach((doc) => {
      const existing = map.get(doc.requiredDocumentId) || [];
      existing.push(doc);
      map.set(doc.requiredDocumentId, existing);
    });
    return map;
  });

  // 필수 서류 검증 (1개 이상 파일이 있으면 충족)
  const requiredDocs = documentBox.requiredDocuments.filter((doc) => doc.isRequired);
  const missingRequiredDocs = requiredDocs.filter((doc) => {
    const uploads = uploadedFilesMap.get(doc.requiredDocumentId);
    return !uploads || uploads.length === 0;
  });
  const canSubmit = missingRequiredDocs.length === 0;

  const handleSave = () => {
    router.push(`/submit/${documentBoxId}`);
  };

  // 프로필 업데이트 API 호출
  const updateUserProfile = async (data: { name?: string; phone?: string }) => {
    try {
      const response = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Failed to update user profile');
      }
    } catch (err) {
      console.error('Failed to update user profile:', err);
    }
  };

  const handleSubmitterInfoSave = async (data: { name: string; email: string; phone: string }) => {
    // 먼저 Submitter 정보 저장
    const response = await fetch('/api/submit/update-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submitterId: initialSubmitter.submitterId,
        ...data,
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || '정보 저장에 실패했습니다.');
    }

    setSubmitterInfo(data);

    // 프로필 업데이트 로직
    const profileUpdates: { name?: string; phone?: string } = {};
    let hasNewData = false;
    let hasChangedData = false;

    // 이름 체크
    if (data.name !== initialSubmitter.name) {
      if (!userProfile?.name) {
        // 기존 프로필에 이름이 없음 → 자동 저장
        profileUpdates.name = data.name;
        hasNewData = true;
      } else if (userProfile.name !== data.name) {
        // 기존 프로필 이름과 다름 → Dialog로 확인
        profileUpdates.name = data.name;
        hasChangedData = true;
      }
    }

    // 연락처 체크
    if (data.phone !== initialSubmitter.phone) {
      if (!userProfile?.phone) {
        // 기존 프로필에 연락처가 없음 → 자동 저장
        profileUpdates.phone = data.phone;
        hasNewData = true;
      } else if (userProfile.phone !== data.phone) {
        // 기존 프로필 연락처와 다름 → Dialog로 확인
        profileUpdates.phone = data.phone;
        hasChangedData = true;
      }
    }

    // 새로 추가되는 데이터가 있으면 자동 저장 + 토스트
    if (hasNewData && !hasChangedData) {
      await updateUserProfile(profileUpdates);
      toast.success('프로필 정보에 자동 저장되었습니다.');
    }
    // 변경되는 데이터가 있으면 Dialog로 확인
    else if (hasChangedData) {
      setPendingProfileUpdate(profileUpdates);
      setProfileDialogOpen(true);
    }
  };

  const handleProfileDialogConfirm = async () => {
    if (pendingProfileUpdate) {
      await updateUserProfile(pendingProfileUpdate);
      toast.success('프로필 정보가 업데이트되었습니다.');
    }
    setProfileDialogOpen(false);
    setPendingProfileUpdate(null);
  };

  const handleProfileDialogCancel = () => {
    setProfileDialogOpen(false);
    setPendingProfileUpdate(null);
  };

  const handleFilesChange = useCallback((uploads: Map<string, UploadedDocument[]>) => {
    const newMap = new Map<string, SubmittedDocument[]>();
    uploads.forEach((uploadList, requiredDocId) => {
      const docs = uploadList.map((upload) => ({
        submittedDocumentId: upload.submittedDocumentId,
        requiredDocumentId: requiredDocId,
        filename: upload.filename,
        originalFilename: upload.originalFilename,
        size: upload.size,
      }));
      newMap.set(requiredDocId, docs);
    });
    setUploadedFilesMap(newMap);
  }, []);

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('필수 서류를 모두 업로드해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/submit/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submitterId: initialSubmitter.submitterId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '제출에 실패했습니다.');
      }

      router.push(`/submit/${documentBoxId}/complete`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 파일 목록 데이터 구성 (복수 파일인 경우 첫 번째 파일 기준, 실제 목록은 EditableFileListCard 내부에서 관리)
  const fileListItems = documentBox.requiredDocuments.map((reqDoc) => {
    const uploads = uploadedFilesMap.get(reqDoc.requiredDocumentId) || [];
    const firstUpload = uploads[0];
    return {
      requiredDocumentId: reqDoc.requiredDocumentId,
      documentTitle: reqDoc.documentTitle,
      documentDescription: reqDoc.documentDescription,
      isRequired: reqDoc.isRequired,
      filename: firstUpload?.filename || null,
      originalFilename: firstUpload?.originalFilename || null,
      submittedDocumentId: firstUpload?.submittedDocumentId,
      size: firstUpload?.size,
    };
  });

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* 페이지 헤더 */}
        <PageHeader
          title="제출정보 확인하기"
          description="제출 정보를 확인 후, 제출 완료해주세요."
          align="center"
        />

        {/* 경고 알림 */}
        <AlertBanner
          type="error"
          message="제출 후에는 내용을 수정할 수 없습니다. 정확한지 다시 한 번 확인해주세요."
          className="mb-6"
        />

        {/* 에러 메시지 */}
        {error && (
          <AlertBanner
            type="error"
            message={error}
            className="mb-6"
          />
        )}

        {/* 제출 서류 정보 */}
        <InfoCard
          title="제출 서류 정보"
          className="mb-4"
        >
          <InfoCard.Field label="서류명" value={documentBox.boxTitle} />
        </InfoCard>

        {/* 제출자 정보 */}
        <SubmitterInfoCard
          title="제출자 정보"
          submitter={submitterInfo}
          onSave={handleSubmitterInfoSave}
          className="mb-4"
        />

        {/* 업로드한 파일 */}
        <EditableFileListCard
          title="업로드한 파일"
          files={fileListItems}
          documentBoxId={documentBoxId}
          submitterId={initialSubmitter.submitterId}
          onFilesChange={handleFilesChange}
          onError={setError}
          className="mb-24"
        />
      </main>

      {/* 하단 고정 버튼 영역 */}
      <SubmitActionFooter
        primaryLabel="확인완료"
        secondaryLabel="임시저장"
        onPrimary={handleSubmit}
        onSecondary={handleSave}
        primaryDisabled={!canSubmit}
        secondaryDisabled={isSubmitting}
        isLoading={isSubmitting}
        loadingLabel="제출 중..."
      />

      {/* 프로필 업데이트 확인 Dialog */}
      <ProfileUpdateDialog
        open={profileDialogOpen}
        onConfirm={handleProfileDialogConfirm}
        onCancel={handleProfileDialogCancel}
        updatedFields={pendingProfileUpdate}
      />
    </div>
  );
}
