'use client';

import { FileText, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/shared/SectionHeader';

interface BasicInfoCardProps {
  /** 문서함 이름 */
  documentName: string;
  /** 문서함 이름 변경 핸들러 */
  onDocumentNameChange: (value: string) => void;
  /** 문서함 설명 */
  description: string;
  /** 문서함 설명 변경 핸들러 */
  onDescriptionChange: (value: string) => void;
  /** 로고 URL */
  logoUrl: string;
  /** 로고 삭제 핸들러 */
  onLogoRemove: () => void;
  /** 로고 다이얼로그 열기 핸들러 */
  onLogoDialogOpen: () => void;
}

/**
 * BasicInfoCard 컴포넌트
 *
 * 문서함의 기본 정보(이름, 설명, 로고)를 입력받는 카드 컴포넌트입니다.
 */
export function BasicInfoCard({
  documentName,
  onDocumentNameChange,
  description,
  onDescriptionChange,
  logoUrl,
  onLogoRemove,
  onLogoDialogOpen,
}: BasicInfoCardProps) {
  return (
    <Card variant="compact" className="mb-6">
      <CardHeader variant="compact">
        <CardTitle>
          <SectionHeader icon={FileText} title="기본 정보 입력" size="md" />
        </CardTitle>
      </CardHeader>

      <CardContent variant="compact">
        <div className="space-y-5">
          {/* 문서함 이름 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              문서함 이름<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={documentName}
              onChange={(e) => onDocumentNameChange(e.target.value)}
              placeholder="예: 2024년 연말정산 서류 제출"
              className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
              required
            />
          </div>

          {/* 문서함 설명 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="문서함에 대한 간단한 설명을 입력하세요"
              rows={3}
              className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-gray-400"
            />
          </div>

          {/* 로고 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              로고 (선택)
            </label>
            {logoUrl ? (
              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <img
                  src={logoUrl}
                  alt="문서함 로고"
                  className="h-12 max-w-[200px] object-contain"
                />
                <button
                  type="button"
                  onClick={onLogoRemove}
                  className="text-sm text-red-500 hover:text-red-600 transition-colors"
                >
                  삭제
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={onLogoDialogOpen}
              >
                <ImageIcon className="w-4 h-4" />
                로고 등록
              </Button>
            )}
            <p className="mt-2 text-xs text-gray-500">
              제출자에게 보여지는 로고입니다. 미등록 시 기본 로고가 적용됩니다.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
