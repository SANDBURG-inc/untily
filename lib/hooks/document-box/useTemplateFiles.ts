'use client';

import { useState, useCallback } from 'react';
import { uploadToS3 } from '@/lib/s3/upload';
import type { DocumentRequirement, TemplateFile } from '@/lib/types/document';
import type { UseTemplateFilesReturn } from './types';

/**
 * 양식 파일 상태 관리 및 S3 업로드 훅
 *
 * 양식 파일의 선택, 삭제, 업로드를 처리합니다.
 */
export function useTemplateFiles(): UseTemplateFilesReturn {
  // 양식 파일 상태 (requirementId -> File[])
  const [templateFiles, setTemplateFiles] = useState<Map<string, File[]>>(new Map());
  const [uploadingTemplateIds, setUploadingTemplateIds] = useState<string[]>([]);

  /**
   * 양식 파일 선택 핸들러 (파일 추가)
   */
  const handleTemplateFileSelect = useCallback((requirementId: string, file: File) => {
    setTemplateFiles((prev) => {
      const newMap = new Map(prev);
      const existingFiles = newMap.get(requirementId) || [];
      newMap.set(requirementId, [...existingFiles, file]);
      return newMap;
    });
  }, []);

  /**
   * 양식 파일 삭제 핸들러
   */
  const handleTemplateFileRemove = useCallback((requirementId: string, index: number) => {
    setTemplateFiles((prev) => {
      const newMap = new Map(prev);
      const existingFiles = newMap.get(requirementId) || [];
      const newFiles = [...existingFiles];
      newFiles.splice(index, 1);

      if (newFiles.length === 0) {
        newMap.delete(requirementId);
      } else {
        newMap.set(requirementId, newFiles);
      }
      return newMap;
    });
  }, []);

  /**
   * 양식 파일 S3 업로드
   * - 기존 업로드된 파일 유지
   * - 새 파일만 업로드
   */
  const uploadTemplateFiles = useCallback(
    async (
      requirements: DocumentRequirement[],
      documentBoxId?: string
    ): Promise<Map<string, TemplateFile[]>> => {
      const results = new Map<string, TemplateFile[]>();

      for (const [requirementId, files] of templateFiles.entries()) {
        const uploadedTemplates: TemplateFile[] = [];

        // 기존에 이미 업로드된 양식 파일들 유지
        const requirement = requirements.find((r) => r.id === requirementId);
        const existingTemplates = requirement?.templates?.filter((t) => t.s3Key) || [];
        uploadedTemplates.push(...existingTemplates);

        setUploadingTemplateIds((prev) => [...prev, requirementId]);

        try {
          // 새로 추가된 파일들만 업로드
          for (const file of files) {
            // Presigned URL 요청
            const presignedRes = await fetch('/api/template/presigned', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                filename: file.name,
                contentType: file.type || 'application/octet-stream',
                size: file.size,
                documentBoxId,
              }),
            });

            if (!presignedRes.ok) {
              const errorData = await presignedRes.json();
              throw new Error(errorData.error || '양식 업로드 URL 생성에 실패했습니다.');
            }

            const { uploadUrl, s3Key } = await presignedRes.json();

            // S3에 업로드
            await uploadToS3({ uploadUrl, file });

            uploadedTemplates.push({ s3Key, filename: file.name });
          }

          results.set(requirementId, uploadedTemplates);
        } finally {
          setUploadingTemplateIds((prev) => prev.filter((id) => id !== requirementId));
        }
      }

      // 새로 업로드된 파일이 없는 requirement의 기존 템플릿도 유지
      for (const req of requirements) {
        if (!results.has(req.id) && req.templates && req.templates.length > 0) {
          results.set(req.id, req.templates.filter((t) => t.s3Key));
        }
      }

      return results;
    },
    [templateFiles]
  );

  /**
   * 모든 양식 파일 초기화
   */
  const clearTemplateFiles = useCallback(() => {
    setTemplateFiles(new Map());
  }, []);

  return {
    // 상태
    templateFiles,
    uploadingTemplateIds,
    // 액션
    handleTemplateFileSelect,
    handleTemplateFileRemove,
    uploadTemplateFiles,
    clearTemplateFiles,
  };
}
