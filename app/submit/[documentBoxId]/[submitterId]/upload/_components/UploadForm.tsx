'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import DocumentUploadItem from '@/components/upload/DocumentUploadItem';
import SubmitPageHeader from '@/components/submit/SubmitPageHeader';

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

interface UploadFormProps {
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
}

interface UploadedDocument {
  submittedDocumentId: string;
  filename: string;
  s3Key: string;
  size?: number;
}

export default function UploadForm({
  documentBox,
  submitter,
  documentBoxId,
  submitterId,
}: UploadFormProps) {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async () => {
    // 필수 서류 업로드 확인
    const requiredDocs = documentBox.requiredDocuments.filter((doc) => doc.isRequired);
    const missingDocs = requiredDocs.filter(
      (doc) => !uploadedDocs.has(doc.requiredDocumentId)
    );

    if (missingDocs.length > 0) {
      setError(`필수 서류를 모두 업로드해 주세요: ${missingDocs.map((d) => d.documentTitle).join(', ')}`);
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

  const uploadedCount = uploadedDocs.size;
  const requiredCount = documentBox.requiredDocuments.filter((d) => d.isRequired).length;
  const totalCount = documentBox.requiredDocuments.length;
  const allRequiredUploaded = uploadedCount >= requiredCount;

  return (
    <div className="flex-1 flex flex-col bg-white">
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <SubmitPageHeader
          title={documentBox.boxTitle}
          description={`${submitter.name} 님, 아래 서류를 업로드해주세요.`}
        />
        {/* 진행 상황 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">제출 진행률</span>
            <span className="text-sm font-medium text-blue-600">
              {uploadedCount}/{totalCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex-1 py-3.5 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            임시저장
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !allRequiredUploaded}
            className="flex-1 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                제출 중...
              </>
            ) : (
              '제출하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
