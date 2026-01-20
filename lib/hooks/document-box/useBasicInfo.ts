'use client';

import { useState, useCallback } from 'react';
import type { UseBasicInfoOptions, UseBasicInfoReturn } from './types';

/**
 * 문서함 기본 정보 상태 관리 훅
 *
 * 문서함명, 설명, 로고 관련 상태와 핸들러를 제공합니다.
 */
export function useBasicInfo(options: UseBasicInfoOptions = {}): UseBasicInfoReturn {
  const { initialData } = options;

  // 기본 정보 상태
  const [documentName, setDocumentName] = useState(initialData?.documentName || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || '');

  // 로고 파일 상태 (생성 모드에서 지연 업로드용)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  // 로고 다이얼로그 상태
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);

  /**
   * 로고 제거 핸들러
   */
  const handleLogoRemove = useCallback(() => {
    setLogoUrl('');
    setLogoFile(null);
    setLogoPreviewUrl(null);
  }, []);

  /**
   * 로고 파일 선택 핸들러 (생성 모드에서 사용)
   */
  const handleLogoSelect = useCallback((file: File, previewUrl: string) => {
    setLogoFile(file);
    setLogoPreviewUrl(previewUrl);
  }, []);

  return {
    // 상태
    documentName,
    description,
    logoUrl,
    logoFile,
    logoPreviewUrl,
    logoDialogOpen,
    // 액션
    setDocumentName,
    setDescription,
    setLogoUrl,
    setLogoDialogOpen,
    handleLogoRemove,
    handleLogoSelect,
  };
}
