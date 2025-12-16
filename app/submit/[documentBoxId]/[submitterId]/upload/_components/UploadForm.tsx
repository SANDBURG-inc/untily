'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import DocumentUploadItem from '@/components/upload/DocumentUploadItem';

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/">
            <Image
              src="/logo_light.svg"
              alt="오늘까지"
              width={100}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
        </div>
      </header>

      {/* Sub Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">{documentBox.boxTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{submitter.name}님의 서류 제출</p>
        </div>
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full p-6">
        {/* 진행 상황 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">제출 진행률</span>
            <span className="text-sm font-medium text-blue-600">
              {uploadedCount}/{totalCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(uploadedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 서류 업로드 영역 */}
        <div className="space-y-4 mb-8">
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
              />
            );
          })}
        </div>

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !allRequiredUploaded}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              제출 중...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              서류 제출하기
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          제출 후에는 수정이 불가능합니다. 서류를 다시 확인해 주세요.
        </p>
      </main>
    </div>
  );
}
