'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { SubmitActionFooter } from '@/app/submit/_components';
import InfoCard from './InfoCard';
import FileListCard from './FileListCard';
import AlertBanner from './AlertBanner';

interface RequiredDocument {
  requiredDocumentId: string;
  documentTitle: string;
  isRequired: boolean;
}

interface SubmittedDocument {
  submittedDocumentId: string;
  requiredDocumentId: string;
  filename: string;
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
    submittedDocuments: SubmittedDocument[];
  };
  documentBoxId: string;
  submitterId: string;
}

export default function CheckoutView({
  documentBox,
  submitter,
  documentBoxId,
  submitterId,
}: CheckoutViewProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 업로드된 파일을 requiredDocument 기준으로 매핑
  const uploadedFilesMap = new Map<string, SubmittedDocument>();
  submitter.submittedDocuments.forEach((doc) => {
    uploadedFilesMap.set(doc.requiredDocumentId, doc);
  });

  // 필수 서류 검증
  const requiredDocs = documentBox.requiredDocuments.filter((doc) => doc.isRequired);
  const missingRequiredDocs = requiredDocs.filter(
    (doc) => !uploadedFilesMap.has(doc.requiredDocumentId)
  );
  const canSubmit = missingRequiredDocs.length === 0;

  const handleEdit = () => {
    router.push(`/submit/${documentBoxId}/${submitterId}/upload`);
  };

  const handleSave = () => {
    // 임시저장은 현재 상태 유지 (이미 서버에 저장됨)
    router.push(`/submit/${documentBoxId}/${submitterId}`);
  };

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
        body: JSON.stringify({ submitterId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '제출에 실패했습니다.');
      }

      router.push(`/submit/${documentBoxId}/${submitterId}/complete`);
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
      documentTitle: reqDoc.documentTitle,
      isRequired: reqDoc.isRequired,
      filename: uploaded?.filename || null,
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
          type="info"
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
        <InfoCard
          title="제출자 정보"
          className="mb-4"
        >
          <InfoCard.Field label="성명" value={submitter.name} />
          <InfoCard.Field label="이메일" value={submitter.email} />
          <InfoCard.Field label="연락처" value={submitter.phone} />
        </InfoCard>

        {/* 업로드한 파일 */}
        <FileListCard
          title="업로드한 파일"
          files={fileListItems}
          onEdit={handleEdit}
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
