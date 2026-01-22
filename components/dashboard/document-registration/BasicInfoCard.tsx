'use client';

import { ImageIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface BasicInfoCardProps {
  /** 문서함 이름 */
  documentName: string;
  /** 문서함 이름 변경 핸들러 */
  onDocumentNameChange: (value: string) => void;
  /** 문서함 설명 */
  description: string;
  /** 문서함 설명 변경 핸들러 */
  onDescriptionChange: (value: string) => void;
  /** 로고 URL (표시용, fallback 포함) */
  logoUrl: string;
  /** 문서함 고유 로고 설정 여부 (삭제 버튼 표시 조건) */
  hasCustomLogo: boolean;
  /** 로고 삭제 핸들러 */
  onLogoRemove: () => void;
  /** 로고 다이얼로그 열기 핸들러 */
  onLogoDialogOpen: () => void;
}

/**
 * BasicInfoCard 컴포넌트
 *
 * 문서함의 기본 정보(이름, 설명, 로고)를 입력받는 카드 컴포넌트입니다.
 * SectionHeader는 부모 CollapsibleSection에서 렌더링합니다.
 */
export function BasicInfoCard({
  documentName,
  onDocumentNameChange,
  description,
  onDescriptionChange,
  logoUrl,
  hasCustomLogo,
  onLogoRemove,
  onLogoDialogOpen,
}: BasicInfoCardProps) {
  return (
    <div className="space-y-5">
      {/* 문서함 이름 입력 */}
      <div>
        <label className="block text-sm font-normal text-gray-700 mb-2">
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
        <label className="block text-sm font-normal text-gray-700 mb-2">
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
        <div className="flex items-center gap-1.5 mb-2">
          <label className="text-sm font-normal text-gray-700">
            로고
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="whitespace-pre-line">
              {"제출 페이지에 업로드한 로고가 표시됩니다.\n미등록 시 유저의 기본 로고가 적용됩니다."}
            </TooltipContent>
          </Tooltip>
        </div>
        {logoUrl ? (
          <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <img
              src={logoUrl}
              alt="문서함 로고"
              className="h-12 max-w-[200px] object-contain"
            />
            {hasCustomLogo ? (
              <button
                type="button"
                onClick={onLogoRemove}
                className="text-sm text-red-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                삭제
              </button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onLogoDialogOpen}
              >
                변경
              </Button>
            )}
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
      </div>
    </div>
  );
}
