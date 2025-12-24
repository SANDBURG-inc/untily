'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { SubmitActionFooter } from '@/app/submit/_components';
import InfoCard from './InfoCard';
import SubmitterInfoCard from '@/app/submit/[documentBoxId]/checkout/_components/SubmitterInfoCard';
import EditableFileListCard from '@/app/submit/[documentBoxId]/checkout/_components/EditableFileListCard';
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
}

export default function CheckoutView({
  documentBox,
  submitter: initialSubmitter,
  documentBoxId,
}: CheckoutViewProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitterInfo, setSubmitterInfo] = useState({
    name: initialSubmitter.name,
    email: initialSubmitter.email,
    phone: initialSubmitter.phone,
  });

  // 업로드된 파일을 requiredDocument 기준으로 매핑
  const [uploadedFilesMap, setUploadedFilesMap] = useState(() => {
    const map = new Map<string, SubmittedDocument>();
    initialSubmitter.submittedDocuments.forEach((doc) => {
      map.set(doc.requiredDocumentId, doc);
    });
    return map;
  });

  // 필수 서류 검증
  const requiredDocs = documentBox.requiredDocuments.filter((doc) => doc.isRequired);
  const missingRequiredDocs = requiredDocs.filter(
    (doc) => !uploadedFilesMap.has(doc.requiredDocumentId)
  );
  const canSubmit = missingRequiredDocs.length === 0;

  const handleSave = () => {
    router.push(`/submit/${documentBoxId}/${initialSubmitter.submitterId}`);
  };

  const handleSubmitterInfoSave = async (data: { name: string; email: string; phone: string }) => {
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
  };

  const handleFilesChange = useCallback((uploads: Map<string, UploadedDocument>) => {
    const newMap = new Map<string, SubmittedDocument>();
    uploads.forEach((upload, requiredDocId) => {
      newMap.set(requiredDocId, {
        submittedDocumentId: upload.submittedDocumentId,
        requiredDocumentId: requiredDocId,
        filename: upload.filename,
        originalFilename: upload.originalFilename,
        size: upload.size,
      });
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

      router.push(`/submit/${documentBoxId}/${initialSubmitter.submitterId}/complete`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 파일 목록 데이터 구성
  const fileListItems = documentBox.requiredDocuments.map((reqDoc) => {
    const uploaded = uploadedFilesMap.get(reqDoc.requiredDocumentId);
    return {
      requiredDocumentId: reqDoc.requiredDocumentId,
      documentTitle: reqDoc.documentTitle,
      documentDescription: reqDoc.documentDescription,
      isRequired: reqDoc.isRequired,
      filename: uploaded?.filename || null,
      originalFilename: uploaded?.originalFilename || null,
      submittedDocumentId: uploaded?.submittedDocumentId,
      size: uploaded?.size,
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
    </div>
  );
}
