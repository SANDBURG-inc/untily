'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DocumentUploadItem from '@/components/submit/upload/DocumentUploadItem';
import type { UploadedDocument } from '@/components/submit/upload/DocumentUploadItem';
import { FormFieldGroupItem } from '@/components/submit/form';
import { PageHeader } from '@/components/shared/PageHeader';
import { LabeledProgress } from '@/components/shared/LabeledProgress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { SubmitActionFooter } from '@/app/submit/_components';
import {
  type FormFieldGroupData,
  type FormFieldData,
  type FormFieldResponseData,
  validateFormFieldValue,
  getIncompleteFormFields,
} from '@/lib/types/form-field';

/** 양식 파일 정보 */
interface TemplateFile {
  s3Key: string;
  filename: string;
}

interface RequiredDocument {
  requiredDocumentId: string;
  documentTitle: string;
  documentDescription: string | null;
  isRequired: boolean;
  templates?: TemplateFile[];
  allowMultipleFiles?: boolean;
}

interface SubmittedDocument {
  submittedDocumentId: string;
  requiredDocumentId: string;
  filename: string;
  originalFilename: string;
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
  /** 폼 필드 그룹 목록 */
  formFieldGroups?: FormFieldGroupData[];
  /** 폼 필드 표시 위치 (true: 서류 위, false: 서류 아래) */
  formFieldsAboveDocuments?: boolean;
  /** 기존 폼 응답 */
  initialFormResponses?: FormFieldResponseData[];
  /** 미리보기 모드 (업로드/저장 불가, UI만 체험) */
  previewMode?: boolean;
  /** 미리보기 모드에서 뒤로가기 핸들러 */
  onPreviewBack?: () => void;
}

// Debounce 시간 (ms)
const DEBOUNCE_DELAY = 500;

export default function BaseUploadForm({
  documentBox,
  submitter,
  documentBoxId,
  submitterId,
  checkoutUrl,
  formFieldGroups = [],
  formFieldsAboveDocuments = false,
  initialFormResponses = [],
  previewMode = false,
  onPreviewBack,
}: BaseUploadFormProps) {
  const router = useRouter();

  // 기존 업로드 파일을 Map으로 초기화 (복수 파일 지원)
  const initialUploads = new Map<string, UploadedDocument[]>();
  submitter.submittedDocuments.forEach((doc) => {
    const existing = initialUploads.get(doc.requiredDocumentId) || [];
    existing.push({
      submittedDocumentId: doc.submittedDocumentId,
      filename: doc.filename,
      originalFilename: doc.originalFilename,
      s3Key: '',
      size: doc.size,
    });
    initialUploads.set(doc.requiredDocumentId, existing);
  });

  // 기존 폼 응답을 Map으로 초기화
  const initialResponses = new Map<string, string>();
  initialFormResponses.forEach((response) => {
    initialResponses.set(response.formFieldId, response.value);
  });

  const [uploadedDocs, setUploadedDocs] = useState<Map<string, UploadedDocument[]>>(initialUploads);
  const [formResponses, setFormResponses] = useState<Map<string, string>>(initialResponses);
  const [formErrors, setFormErrors] = useState<Map<string, string>>(new Map());
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Debounce를 위한 타이머 ref
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      debounceTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const handleUploadsChange = useCallback((requiredDocumentId: string, uploads: UploadedDocument[]) => {
    setUploadedDocs((prev) => {
      const newMap = new Map(prev);
      if (uploads.length > 0) {
        newMap.set(requiredDocumentId, uploads);
      } else {
        newMap.delete(requiredDocumentId);
      }
      return newMap;
    });
    setError(null);
  }, []);

  const handleUploadError = useCallback((errorMsg: string) => {
    setError(errorMsg);
  }, []);

  // 폼 응답 자동 저장 (미리보기 모드에서는 실행 안 함)
  const saveFormResponse = useCallback(async (fieldId: string, value: string) => {
    // 미리보기 모드에서는 저장하지 않음
    if (previewMode) return;

    setSavingFields((prev) => new Set(prev).add(fieldId));

    try {
      const response = await fetch('/api/submit/form-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentBoxId,
          submitterId,
          formFieldId: fieldId,
          value,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Form response save failed:', data.error);
      }
    } catch (err) {
      console.error('Form response save error:', err);
    } finally {
      setSavingFields((prev) => {
        const next = new Set(prev);
        next.delete(fieldId);
        return next;
      });
    }
  }, [documentBoxId, submitterId, previewMode]);

  // 폼 응답 변경 핸들러 (debounce 적용)
  const handleFormResponseChange = useCallback((fieldId: string, value: string) => {
    // 즉시 상태 업데이트 (UI 반영)
    setFormResponses((prev) => {
      const newMap = new Map(prev);
      newMap.set(fieldId, value);
      return newMap;
    });

    // 에러 초기화
    setFormErrors((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fieldId);
      return newMap;
    });
    setError(null);

    // 기존 타이머 취소
    const existingTimer = debounceTimers.current.get(fieldId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 새 타이머 설정 (debounce)
    const newTimer = setTimeout(() => {
      saveFormResponse(fieldId, value);
      debounceTimers.current.delete(fieldId);
    }, DEBOUNCE_DELAY);

    debounceTimers.current.set(fieldId, newTimer);
  }, [saveFormResponse]);

  const handleSubmit = () => {
    // 1. 필수 서류 업로드 확인
    const requiredDocs = documentBox.requiredDocuments.filter((doc) => doc.isRequired);
    const missingDocs = requiredDocs.filter((doc) => {
      const uploads = uploadedDocs.get(doc.requiredDocumentId);
      return !uploads || uploads.length === 0;
    });

    if (missingDocs.length > 0) {
      setError(`필수 서류를 모두 업로드해 주세요: ${missingDocs.map((d) => d.documentTitle).join(', ')}`);
      return;
    }

    // 2. 필수 폼 필드 검증 - 그룹에서 필드 평탄화
    const allFields: FormFieldData[] = formFieldGroups.flatMap(g => g.fields);
    const incompleteFields = getIncompleteFormFields(
      allFields,
      Array.from(formResponses.entries()).map(([formFieldId, value]) => ({ formFieldId, value }))
    );

    if (incompleteFields.length > 0) {
      // 첫 번째 미완료 필드에 포커스할 수 있도록 에러 설정
      const newErrors = new Map<string, string>();

      // 모든 필수 그룹의 필수 필드 검증
      formFieldGroups.forEach((group) => {
        if (!group.isRequired) return;
        group.fields.forEach((field) => {
          if (!field.isRequired) return;
          const value = formResponses.get(field.id) || '';
          const validationError = validateFormFieldValue(
            field.fieldType,
            value,
            true,
            field.validation
          );
          if (validationError) {
            newErrors.set(field.id, validationError);
          }
        });
      });

      setFormErrors(newErrors);
      setError(`필수 입력 항목을 모두 작성해 주세요.`);
      return;
    }

    // 체크아웃 페이지로 이동
    router.push(checkoutUrl);
  };

  // 진행률 계산
  const uploadedCount = Array.from(uploadedDocs.values()).filter((uploads) => uploads.length > 0).length;
  const requiredDocCount = documentBox.requiredDocuments.filter((d) => d.isRequired).length;
  const totalDocCount = documentBox.requiredDocuments.length;

  // 폼 필드 완료 수 계산
  let completedFormFields = 0;
  let totalRequiredFormFields = 0;
  formFieldGroups.forEach((group) => {
    group.fields.forEach((field) => {
      if (field.isRequired) {
        totalRequiredFormFields++;
        const value = formResponses.get(field.id) || '';
        const error = validateFormFieldValue(field.fieldType, value, true, field.validation);
        if (!error) {
          completedFormFields++;
        }
      }
    });
  });

  // 전체 진행률: 파일 + 폼 필드
  const totalItems = totalDocCount + totalRequiredFormFields;
  const completedItems = uploadedCount + completedFormFields;

  // 제출 가능 여부
  const allRequiredUploaded = uploadedCount >= requiredDocCount;
  const allRequiredFormsFilled = completedFormFields >= totalRequiredFormFields;
  const canProceed = allRequiredUploaded && allRequiredFormsFilled;

  // 폼 필드 그룹 정렬
  const sortedFormFieldGroups = [...formFieldGroups].sort((a, b) => a.order - b.order);

  // 폼 필드 그룹 렌더링
  const renderFormFieldGroups = () => {
    if (sortedFormFieldGroups.length === 0) return null;

    return (
      <div className="space-y-4">
        {sortedFormFieldGroups.map((group) => (
          <FormFieldGroupItem
            key={group.id}
            group={group}
            responses={formResponses}
            onResponseChange={handleFormResponseChange}
            errors={formErrors}
            savingFields={savingFields}
          />
        ))}
      </div>
    );
  };

  // 파일 업로드 영역 렌더링
  const renderDocumentUploads = () => (
    <div className="space-y-4">
      {documentBox.requiredDocuments.map((doc) => {
        const existingUploads = uploadedDocs.get(doc.requiredDocumentId) || [];
        return (
          <DocumentUploadItem
            key={doc.requiredDocumentId}
            requiredDocument={doc}
            documentBoxId={documentBoxId}
            submitterId={submitterId}
            existingUploads={existingUploads}
            onUploadsChange={(uploads) => handleUploadsChange(doc.requiredDocumentId, uploads)}
            onUploadError={handleUploadError}
            previewMode={previewMode}
          />
        );
      })}
    </div>
  );

  // 설명 문구 결정
  const description = formFieldGroups.length > 0
    ? `${submitter.name} 님, 아래 항목을 작성하고 서류를 업로드해주세요.`
    : `${submitter.name} 님, 아래 서류를 업로드해주세요.`;

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <PageHeader
          title={documentBox.boxTitle}
          description={description}
          align="center"
        />

        {/* 진행 상황 */}
        <Card className="mb-6">
          <CardContent>
            <LabeledProgress
              label="제출 진행률"
              current={completedItems}
              total={totalItems}
            />
          </CardContent>
        </Card>

        {/* 에러 메시지 */}
        {error && (
          <AlertBanner type="error" message={error} className="mb-6" />
        )}

        {/* 콘텐츠 영역 */}
        <div className="space-y-6 mb-24">
          {formFieldsAboveDocuments ? (
            <>
              {renderFormFieldGroups()}
              {renderDocumentUploads()}
            </>
          ) : (
            <>
              {renderDocumentUploads()}
              {renderFormFieldGroups()}
            </>
          )}
        </div>
      </main>

      {/* 하단 고정 버튼 영역 */}
      {previewMode ? (
        // 미리보기 모드: sticky footer (Sheet 내부에서 동작)
        <footer className="sticky bottom-0 bg-card border-t border-border px-4 py-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={onPreviewBack}
            >
              뒤로가기
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={true}
            >
              다음
            </Button>
          </div>
        </footer>
      ) : (
        <SubmitActionFooter
          primaryLabel="다음"
          secondaryLabel="임시저장"
          onPrimary={handleSubmit}
          onSecondary={() => router.back()}
          primaryDisabled={!canProceed}
        />
      )}
    </div>
  );
}
