'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { SubmitActionFooter } from '@/app/submit/_components';
import InfoCard from './InfoCard';
import SubmitterInfoCard from '@/app/submit/[documentBoxId]/checkout/_components/SubmitterInfoCard';
import EditableFileListCard from '@/app/submit/[documentBoxId]/checkout/_components/EditableFileListCard';
import FormResponseCard from '@/app/submit/[documentBoxId]/checkout/_components/FormResponseCard';
import type { UploadedDocument } from '@/components/submit/upload/DocumentUploadItem';
import type { FormFieldGroupData, FormFieldResponseData } from '@/lib/types/form-field';
import { getIncompleteFormFields } from '@/lib/types/form-field';

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

interface CheckoutViewProps {
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
  documentBoxId: string;
  /** 폼 필드 그룹 목록 */
  formFieldGroups?: FormFieldGroupData[];
  /** 폼 응답 목록 */
  formResponses?: FormFieldResponseData[];
}

export default function CheckoutView({
  documentBox,
  submitter: initialSubmitter,
  documentBoxId,
  formFieldGroups = [],
  formResponses = [],
}: CheckoutViewProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitterInfo = {
    name: initialSubmitter.name,
    email: initialSubmitter.email,
    phone: initialSubmitter.phone,
  };

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
  const allDocsUploaded = missingRequiredDocs.length === 0;

  // 필수 폼 필드 검증
  const incompleteFormFields = getIncompleteFormFields(formFieldGroups, formResponses);
  const allFormsCompleted = incompleteFormFields.length === 0;

  // 최종 제출 가능 여부
  const canSubmit = allDocsUploaded && allFormsCompleted;

  const handleSave = () => {
    router.push(`/submit/${documentBoxId}/${initialSubmitter.submitterId}`);
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
    // 서류 검증
    if (!allDocsUploaded) {
      setError('필수 서류를 모두 업로드해주세요.');
      return;
    }

    // 폼 필드 검증
    if (!allFormsCompleted) {
      const firstIncomplete = incompleteFormFields[0];
      setError(`필수 입력 항목을 모두 작성해주세요: ${firstIncomplete.groupTitle} - ${firstIncomplete.fieldLabel}`);
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

      router.push(`/submit/${documentBoxId}/${initialSubmitter.submitterId}/complete`);
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
          editable={false}
          className="mb-4"
        />

        {/* 입력 정보 (폼 응답) */}
        {formFieldGroups.length > 0 && (
          <FormResponseCard
            title="입력 정보"
            formFieldGroups={formFieldGroups}
            formResponses={formResponses}
            className="mb-4"
          />
        )}

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
    </div>
  );
}
