'use client';

import * as React from 'react';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

/**
 * 섹션 헤더 크기 타입
 * - sm: 폼 입력 섹션 (text-base, 아이콘 w-5 h-5)
 * - md: 기본 섹션 (text-lg, 아이콘 w-5 h-5)
 * - lg: 상세 페이지 섹션 (text-xl, 아이콘 w-6 h-6)
 */
type SectionHeaderSize = 'sm' | 'md' | 'lg';

const sizeStyles: Record<SectionHeaderSize, { title: string; icon: string }> = {
  sm: {
    title: 'text-base font-semibold text-gray-900',
    icon: 'w-5 h-5',
  },
  md: {
    title: 'text-lg font-semibold text-gray-900',
    icon: 'w-5 h-5',
  },
  lg: {
    title: 'text-xl font-bold text-gray-900',
    icon: 'w-6 h-6',
  },
};

interface SectionHeaderProps {
  /** 섹션 타이틀 (필수) */
  title: string;
  /** 타이틀 왼쪽 아이콘 (Lucide Icon 컴포넌트) */
  icon?: React.ComponentType<{ className?: string }>;
  /** 섹션 설명 텍스트 */
  description?: string;
  /** 헤더 크기 (기본값: lg) */
  size?: SectionHeaderSize;
  /** 추가 className */
  className?: string;
  /** 접기/펼치기 기능 활성화 */
  collapsible?: boolean;
  /** 현재 열림 상태 (collapsible=true일 때만 사용) */
  isOpen?: boolean;
  /** 토글 핸들러 (collapsible=true일 때만 사용) */
  onToggle?: () => void;
  /** 툴팁 텍스트 (i 아이콘 hover 시 표시) */
  tooltip?: string;
}

/**
 * SectionHeader 컴포넌트
 *
 * 카드 섹션의 타이틀을 통일된 스타일로 렌더링합니다.
 * CardHeader, CardTitle과 함께 사용하거나 독립적으로 사용할 수 있습니다.
 *
 * @example
 * ```tsx
 * // 툴팁 포함
 * <SectionHeader
 *   icon={Users}
 *   title="제출자 등록"
 *   tooltip="제출자를 등록하면 해당 이메일로만 제출이 가능합니다."
 *   size="md"
 * />
 * ```
 */
export function SectionHeader({
  title,
  icon: Icon,
  description,
  size = 'lg',
  className,
  collapsible = false,
  isOpen = true,
  onToggle,
  tooltip,
}: SectionHeaderProps) {
  const styles = sizeStyles[size];

  // 툴팁 아이콘 렌더링
  const TooltipIcon = tooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px]">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  ) : null;

  // Collapsible 모드일 때 클릭 가능한 헤더
  if (collapsible) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-2 text-left group hover:opacity-80 transition-opacity"
          >
            {/* Chevron 아이콘 (열림/닫힘 상태 표시) */}
            {isOpen ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
            {Icon && <Icon className={cn(styles.icon, 'text-gray-700')} />}
            <span className={styles.title}>{title}</span>
          </button>
          {TooltipIcon}
        </div>
        {description && isOpen && (
          <p className="text-sm text-gray-500 pl-7">{description}</p>
        )}
      </div>
    );
  }

  // 기본 모드 (기존 동작)
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className={cn(styles.icon, 'text-gray-700')} />}
        <span className={styles.title}>{title}</span>
        {TooltipIcon}
      </div>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}
