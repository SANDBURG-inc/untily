import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

/**
 * SectionHeader 컴포넌트
 *
 * 카드 섹션의 타이틀을 통일된 스타일로 렌더링합니다.
 * CardHeader, CardTitle과 함께 사용하거나 독립적으로 사용할 수 있습니다.
 *
 * @example
 * ```tsx
 * // CardTitle 내부에서 사용 (권장)
 * <CardHeader>
 *   <CardTitle>
 *     <SectionHeader icon={FileText} title="기본 정보 입력" />
 *   </CardTitle>
 * </CardHeader>
 *
 * // 설명 포함
 * <SectionHeader
 *   icon={Users}
 *   title="제출자 목록"
 *   description="서류를 제출할 사람들을 관리합니다."
 *   size="lg"
 * />
 *
 * // Collapsible 기능 사용
 * <SectionHeader
 *   icon={Settings}
 *   title="제출 옵션 설정"
 *   size="sm"
 *   collapsible
 *   isOpen={isOpen}
 *   onToggle={() => setIsOpen(!isOpen)}
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
}: SectionHeaderProps) {
  const styles = sizeStyles[size];

  // Collapsible 모드일 때 클릭 가능한 헤더
  if (collapsible) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 w-full text-left group hover:opacity-80 transition-opacity"
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
      </div>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}
