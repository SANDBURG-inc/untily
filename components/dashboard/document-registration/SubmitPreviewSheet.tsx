'use client';

import { Eye } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import BaseUploadForm from '@/components/submit/upload/BaseUploadForm';
import type { FormFieldGroupData } from '@/lib/types/form-field';

/** 미리보기용 수집 서류 데이터 */
export interface PreviewRequiredDocument {
  requiredDocumentId: string;
  documentTitle: string;
  documentDescription: string | null;
  isRequired: boolean;
  allowMultipleFiles?: boolean;
}

interface SubmitPreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 문서함 제목 */
  documentBoxTitle: string;
  /** 수집 서류 목록 */
  requirements: PreviewRequiredDocument[];
  /** 폼 필드 그룹 목록 */
  formFieldGroups: FormFieldGroupData[];
  /** 폼 필드 표시 위치 (true: 서류 위, false: 서류 아래) */
  formFieldsAboveDocuments: boolean;
}

/**
 * SubmitPreviewSheet 컴포넌트
 *
 * 문서함 생성/수정 시 제출자 화면을 미리 볼 수 있는 Sheet입니다.
 * BaseUploadForm을 previewMode로 렌더링하여 실제 제출 화면을 체험할 수 있습니다.
 *
 * - 업로드/저장 불가 (미리보기 전용)
 * - 양식 다운로드 버튼 숨김 (실제 S3 파일 없음)
 * - 폼 입력 체험 가능 (로컬 상태만)
 */
export function SubmitPreviewSheet({
  open,
  onOpenChange,
  documentBoxTitle,
  requirements,
  formFieldGroups,
  formFieldsAboveDocuments,
}: SubmitPreviewSheetProps) {
  // BaseUploadForm에 전달할 데이터 변환
  const previewDocumentBox = {
    boxTitle: documentBoxTitle || '문서함 제목',
    requiredDocuments: requirements.map((req) => ({
      requiredDocumentId: req.requiredDocumentId,
      documentTitle: req.documentTitle,
      documentDescription: req.documentDescription,
      isRequired: req.isRequired,
      allowMultipleFiles: req.allowMultipleFiles,
    })),
  };

  const previewSubmitter = {
    name: '홍길동', // 미리보기용 가상 제출자
    submittedDocuments: [], // 미리보기에서는 제출된 파일 없음
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[95vw] sm:w-[85vw] lg:w-[70vw] max-w-[1000px] overflow-y-auto p-0"
      >
        <SheetHeader className="sticky top-0 z-10 bg-white border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <SheetTitle>제출화면 미리보기</SheetTitle>
              <SheetDescription>
                제출자에게 보여지는 화면입니다. 업로드 및 저장은 동작하지 않습니다.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* 미리보기 배너 */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <p className="text-sm text-amber-800 text-center">
            🔍 미리보기 모드 - 실제 업로드 및 저장은 동작하지 않습니다
          </p>
        </div>

        {/* BaseUploadForm을 미리보기 모드로 렌더링 */}
        <div className="bg-gray-50 min-h-full">
          <BaseUploadForm
            documentBox={previewDocumentBox}
            submitter={previewSubmitter}
            documentBoxId="preview"
            submitterId="preview"
            checkoutUrl="#"
            formFieldGroups={formFieldGroups}
            formFieldsAboveDocuments={formFieldsAboveDocuments}
            previewMode={true}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
