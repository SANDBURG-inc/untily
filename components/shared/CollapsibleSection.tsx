'use client';

import * as React from 'react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { SectionHeader } from './SectionHeader';

/**
 * CollapsibleSection 컴포넌트 Props
 */
interface CollapsibleSectionProps {
  /** 섹션 타이틀 */
  title: string;
  /** 타이틀 왼쪽 아이콘 (Lucide Icon 컴포넌트) */
  icon?: React.ComponentType<{ className?: string }>;
  /** 헤더 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 현재 열림 상태 */
  isOpen: boolean;
  /** 토글 핸들러 */
  onToggle: () => void;
  /** 섹션 내용 */
  children: React.ReactNode;
  /** 헤더 우측 액션 (예: Switch 토글) */
  rightAction?: React.ReactNode;
  /** 추가 className */
  className?: string;
}

/**
 * CollapsibleSection 컴포넌트
 *
 * SectionHeader와 Collapsible을 결합한 래퍼 컴포넌트입니다.
 * 섹션을 접거나 펼칠 수 있는 UI를 제공합니다.
 *
 * @example
 * ```tsx
 * // 기본 사용
 * <CollapsibleSection
 *   title="기본 정보"
 *   icon={FileText}
 *   size="md"
 *   isOpen={isOpen}
 *   onToggle={() => setIsOpen(!isOpen)}
 * >
 *   <BasicInfoCard {...props} />
 * </CollapsibleSection>
 *
 * // 우측 액션 포함 (예: Switch)
 * <CollapsibleSection
 *   title="서류 제출자 등록"
 *   icon={Users}
 *   size="md"
 *   isOpen={isOpen}
 *   onToggle={() => setIsOpen(!isOpen)}
 *   rightAction={<Switch checked={enabled} onCheckedChange={setEnabled} />}
 * >
 *   <SubmitterContent {...props} />
 * </CollapsibleSection>
 * ```
 */
export function CollapsibleSection({
  title,
  icon,
  size = 'md',
  isOpen,
  onToggle,
  children,
  rightAction,
  className,
}: CollapsibleSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className={className}>
      <div className="flex items-center justify-between">
        <SectionHeader
          title={title}
          icon={icon}
          size={size}
          collapsible
          isOpen={isOpen}
          onToggle={onToggle}
        />
        {rightAction && (
          <div onClick={(e) => e.stopPropagation()}>
            {rightAction}
          </div>
        )}
      </div>
      <CollapsibleContent>
        <div className="mt-4">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
