'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  type DocumentBoxStatus,
  DOCUMENT_BOX_STATUS_SHORT_LABELS,
  getAvailableStatusChangeOptions,
} from '@/lib/types/document';
import { updateDocumentBoxStatus } from '@/app/dashboard/[id]/actions';

interface StatusChangeDropdownProps {
  documentBoxId: string;
  currentStatus: DocumentBoxStatus;
  /** Badge 크기: sm은 카드용, lg는 페이지 헤더용 */
  size?: 'sm' | 'lg';
}

/**
 * 문서함 상태 변경 드롭다운 (낙관적 UI 적용)
 *
 * 현재 상태를 Badge로 표시하고, 클릭하면 변경 가능한 옵션을 드롭다운으로 보여줍니다.
 * - CLOSED/CLOSED_EXPIRED → "열림으로 변경" → OPEN_RESUME
 * - OPEN/OPEN_SOMEONE/OPEN_RESUME → "닫힘으로 변경" → CLOSED
 */
export function StatusChangeDropdown({
  documentBoxId,
  currentStatus,
  size = 'sm',
}: StatusChangeDropdownProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 낙관적 UI: 클릭 즉시 상태 변경, 실패 시 롤백
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    currentStatus,
    (_current, newStatus: DocumentBoxStatus) => newStatus
  );

  const options = getAvailableStatusChangeOptions(optimisticStatus);

  // 상태별 Badge variant 매핑
  const getBadgeVariant = (status: DocumentBoxStatus) => {
    switch (status) {
      case 'OPEN':
      case 'OPEN_RESUME':
        return 'success' as const;
      case 'OPEN_SOMEONE':
        return 'warning' as const;
      case 'CLOSED':
      case 'CLOSED_EXPIRED':
      default:
        return 'secondary' as const;
    }
  };

  // 크기별 스타일
  const sizeStyles = {
    sm: {
      badge: '',
      icon: 'w-3 h-3',
    },
    lg: {
      badge: 'text-sm px-3 py-1',
      icon: 'w-4 h-4',
    },
  };

  const handleStatusChange = (newStatus: DocumentBoxStatus) => {
    setOpen(false);

    startTransition(async () => {
      // 낙관적으로 즉시 UI 업데이트
      setOptimisticStatus(newStatus);

      try {
        const result = await updateDocumentBoxStatus(documentBoxId, newStatus);
        if (!result.success) {
          // 실패 시 alert (revalidatePath로 자동 롤백됨)
          alert(result.error || '상태 변경에 실패했습니다.');
        }
      } catch (error) {
        console.error('Status change error:', error);
        alert('상태 변경 중 오류가 발생했습니다.');
      }
    });
  };

  // 변경 가능한 옵션이 없으면 Badge만 표시
  if (options.length === 0) {
    return (
      <Badge
        variant={getBadgeVariant(optimisticStatus)}
        className={sizeStyles[size].badge}
      >
        {DOCUMENT_BOX_STATUS_SHORT_LABELS[optimisticStatus]}
      </Badge>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={isPending}>
        <button
          className="inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
          disabled={isPending}
        >
          <Badge
            variant={getBadgeVariant(optimisticStatus)}
            className={`cursor-pointer hover:opacity-80 transition-opacity ${sizeStyles[size].badge}`}
          >
            {DOCUMENT_BOX_STATUS_SHORT_LABELS[optimisticStatus]}
            <ChevronDown className={`${sizeStyles[size].icon} ml-0.5`} />
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.to}
            onClick={() => handleStatusChange(option.to)}
            className="cursor-pointer"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
