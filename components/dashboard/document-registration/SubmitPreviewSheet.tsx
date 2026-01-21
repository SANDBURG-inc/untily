'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SubmitLandingLayout } from '@/components/submit/SubmitLandingLayout';
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

/** 미리보기 화면 상태 타입 */
export type PreviewView = 'landing' | 'upload';

interface SubmitPreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 문서함 제목 */
  documentBoxTitle: string;
  /** 문서함 설명 */
  documentBoxDescription?: string;
  /** 로고 URL (없으면 기본 로고 사용) */
  logoUrl?: string;
  /** 수집 서류 목록 */
  requirements: PreviewRequiredDocument[];
  /** 폼 필드 그룹 목록 */
  formFieldGroups: FormFieldGroupData[];
  /** 폼 필드 표시 위치 (true: 서류 위, false: 서류 아래) */
  formFieldsAboveDocuments: boolean;
  /** Sheet 열릴 때 시작 화면 (기본값: 'landing') */
  initialView?: PreviewView;
  /** 화면 전환 시 부모에게 알림 */
  onViewChange?: (view: PreviewView) => void;
}

/**
 * SubmitPreviewSheet 컴포넌트
 *
 * 문서함 생성/수정 시 제출자 화면을 미리 볼 수 있는 Sheet입니다.
 * 실제 제출 플로우와 동일하게 Landing → Upload 화면으로 이동합니다.
 *
 * - 업로드/저장 불가 (미리보기 전용)
 * - 양식 다운로드 버튼 숨김 (실제 S3 파일 없음)
 * - 폼 입력 체험 가능 (로컬 상태만)
 * - 화면 전환 시 스크롤 위치 기억
 */
export function SubmitPreviewSheet({
  open,
  onOpenChange,
  documentBoxTitle,
  documentBoxDescription,
  logoUrl,
  requirements,
  formFieldGroups,
  formFieldsAboveDocuments,
  initialView = 'landing',
  onViewChange,
}: SubmitPreviewSheetProps) {
  // 현재 화면 상태 (landing | upload)
  const [currentView, setCurrentView] = useState<PreviewView>('landing');

  // 스크롤 컨테이너 ref
  const contentRef = useRef<HTMLDivElement>(null);

  // 각 화면의 스크롤 위치 저장
  const scrollPositions = useRef<Record<PreviewView, number>>({
    landing: 0,
    upload: 0,
  });

  // Sheet 열릴 때 initialView로 동기화, 닫힐 때 스크롤만 초기화
  useEffect(() => {
    if (open) {
      // Sheet 열릴 때: 부모에서 전달받은 initialView로 시작
      setCurrentView(initialView);
    } else {
      // Sheet 닫힐 때: 스크롤 위치만 초기화 (currentView는 부모가 관리)
      scrollPositions.current = { landing: 0, upload: 0 };
    }
  }, [open, initialView]);

  // 화면 전환 핸들러 (스크롤 위치 저장 후 전환)
  const handleViewChange = useCallback((newView: PreviewView) => {
    // 현재 스크롤 위치 저장
    if (contentRef.current) {
      scrollPositions.current[currentView] = contentRef.current.scrollTop;
    }

    // 화면 전환
    setCurrentView(newView);

    // 부모 컴포넌트에 화면 변경 알림 (Sheet 재열림 시 상태 유지용)
    onViewChange?.(newView);

    // 전환 후 저장된 스크롤 위치로 복원 (다음 렌더 사이클에서)
    requestAnimationFrame(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop = scrollPositions.current[newView];
      }
    });
  }, [currentView, onViewChange]);

  // 기본 로고 URL (실제 로고가 없을 때 사용)
  const effectiveLogoUrl = logoUrl || '/images/logo.svg';

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
        ref={contentRef}
        side="right"
        className="w-[95vw] sm:w-[85vw] lg:w-[70vw] max-w-[1000px] overflow-y-auto p-0"
      >
        {/* 간결한 미리보기 모드 표시 */}
        <SheetHeader className="sticky top-0 z-10 bg-white border-b px-6 py-4">
          <SheetTitle className="text-xl font-bold text-gray-700">미리보기 모드</SheetTitle>
        </SheetHeader>

        {/* 화면 전환 */}
        <div className="bg-gray-50 min-h-full">
          {currentView === 'landing' ? (
            // Landing 화면
            <SubmitLandingLayout
              title={documentBoxTitle || '문서함 제목'}
              logoUrl={effectiveLogoUrl}
              buttonText="문서 제출하기"
              buttonOnClick={() => handleViewChange('upload')}
            >
              {/* 제출자 정보 섹션 */}
              <div className="bg-[#EFF6FF] rounded-lg py-5 px-4 text-center mb-6">
                <p className="text-lg font-semibold text-foreground mb-1">
                  홍길동 님
                </p>
                <p className="text-muted-foreground">서류 제출을 진행해주세요!</p>
              </div>

              {/* 문서함 설명 (있을 경우) */}
              {documentBoxDescription && (
                <div className="mb-6 text-sm text-muted-foreground text-center whitespace-pre-wrap">
                  {documentBoxDescription}
                </div>
              )}
            </SubmitLandingLayout>
          ) : (
            // Upload 화면
            <BaseUploadForm
              documentBox={previewDocumentBox}
              submitter={previewSubmitter}
              documentBoxId="preview"
              submitterId="preview"
              checkoutUrl="#"
              formFieldGroups={formFieldGroups}
              formFieldsAboveDocuments={formFieldsAboveDocuments}
              previewMode={true}
              onPreviewBack={() => handleViewChange('landing')}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
