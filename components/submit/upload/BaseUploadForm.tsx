'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DocumentUploadItem from '@/components/submit/upload/DocumentUploadItem';
import { PageHeader } from '@/components/shared/PageHeader';
import { LabeledProgress } from '@/components/shared/LabeledProgress';
import { Card, CardContent } from '@/components/ui/card';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { SubmitActionFooter } from '@/app/submit/_components';

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
  size?: number;
}

export interface BaseUploadFormProps {
  documentBox: {
    boxTitle: string;
    requiredDocuments: RequiredDocument[];
  };
  submitter: {
    name: string;
    submittedDocuments: SubmittedDocument[];
  };
  documentBoxId: string;
  submitterId: string;
  checkoutUrl: string;
}

interface UploadedDocument {
  submittedDocumentId: string;
  filename: string;
  s3Key: string;
  size?: number;
}

export default function BaseUploadForm({
  documentBox,
  submitter,
  documentBoxId,
  submitterId,
  checkoutUrl,
}: BaseUploadFormProps) {
  const router = useRouter();

  // 기존 업로드 파일을 Map으로 초기화
  const initialUploads = new Map<string, UploadedDocument>();
  submitter.submittedDocuments.forEach((doc) => {
    initialUploads.set(doc.requiredDocumentId, {
      submittedDocumentId: doc.submittedDocumentId,
      filename: doc.filename,
      s3Key: '',
      size: doc.size,
    });
  });

  const [uploadedDocs, setUploadedDocs] = useState<Map<string, UploadedDocument>>(initialUploads);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = useCallback((requiredDocumentId: string, upload: UploadedDocument) => {
    setUploadedDocs((prev) => {
      const newMap = new Map(prev);
      newMap.set(requiredDocumentId, upload);
      return newMap;
    });
    setError(null);
  }, []);

  const handleUploadRemove = useCallback((requiredDocumentId: string) => {
    setUploadedDocs((prev) => {
      const newMap = new Map(prev);
      newMap.delete(requiredDocumentId);
      return newMap;
    });
  }, []);

  const handleUploadError = useCallback((errorMsg: string) => {
    setError(errorMsg);
  }, []);

  const handleSubmit = () => {
    // 필수 서류 업로드 확인
    const requiredDocs = documentBox.requiredDocuments.filter((doc) => doc.isRequired);
    const missingDocs = requiredDocs.filter(
      (doc) => !uploadedDocs.has(doc.requiredDocumentId)
    );

    if (missingDocs.length > 0) {
      setError(`필수 서류를 모두 업로드해 주세요: ${missingDocs.map((d) => d.documentTitle).join(', ')}`);
      return;
    }

    // 체크아웃 페이지로 이동
    router.push(checkoutUrl);
  };

  const uploadedCount = uploadedDocs.size;
  const requiredCount = documentBox.requiredDocuments.filter((d) => d.isRequired).length;
  const totalCount = documentBox.requiredDocuments.length;
  const allRequiredUploaded = uploadedCount >= requiredCount;

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <PageHeader
          title={documentBox.boxTitle}
          description={`${submitter.name} 님, 아래 서류를 업로드해주세요.`}
          align="center"
        />

        {/* 진행 상황 */}
        <Card className="mb-6">
          <CardContent>
            <LabeledProgress
              label="제출 진행률"
              current={uploadedCount}
              total={totalCount}
            />
          </CardContent>
        </Card>

        {/* 에러 메시지 */}
        {error && (
          <AlertBanner type="error" message={error} className="mb-6" />
        )}

        {/* 서류 업로드 영역 */}
        <div className="space-y-4 mb-24">
          {documentBox.requiredDocuments.map((doc) => {
            const existingUpload = uploadedDocs.get(doc.requiredDocumentId);
            return (
              <DocumentUploadItem
                key={doc.requiredDocumentId}
                requiredDocument={doc}
                documentBoxId={documentBoxId}
                submitterId={submitterId}
                existingUpload={existingUpload}
                onUploadComplete={(upload) => handleUploadComplete(doc.requiredDocumentId, upload)}
                onUploadError={handleUploadError}
                onUploadRemove={() => handleUploadRemove(doc.requiredDocumentId)}
              />
            );
          })}
        </div>
      </main>

      {/* 하단 고정 버튼 영역 */}
      <SubmitActionFooter
        primaryLabel="다음"
        secondaryLabel="임시저장"
        onPrimary={handleSubmit}
        onSecondary={() => router.back()}
        primaryDisabled={!allRequiredUploaded}
      />
    </div>
  );
}
