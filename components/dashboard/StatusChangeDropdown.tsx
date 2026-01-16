'use client';

import { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
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
}

/**
 * 문서함 상태 변경 드롭다운
 *
 * 현재 상태를 Badge로 표시하고, 클릭하면 변경 가능한 옵션을 드롭다운으로 보여줍니다.
 * - CLOSED/CLOSED_EXPIRED → "열림으로 변경" → OPEN_RESUME
 * - OPEN/OPEN_SOMEONE/OPEN_RESUME → "닫힘으로 변경" → CLOSED
 */
export function StatusChangeDropdown({
  documentBoxId,
  currentStatus,
}: StatusChangeDropdownProps) {
  const [isPending, setIsPending] = useState(false);
  const [open, setOpen] = useState(false);

  const options = getAvailableStatusChangeOptions(currentStatus);

  // 상태별 Badge variant 매핑
  const getBadgeVariant = (status: DocumentBoxStatus) => {
    switch (status) {
      case 'OPEN':
        return 'success' as const;
      case 'OPEN_RESUME':
        return 'success' as const;
      case 'OPEN_SOMEONE':
        return 'warning' as const;
      case 'CLOSED':
        return 'secondary' as const;
      case 'CLOSED_EXPIRED':
        return 'secondary' as const;
      default:
        return 'secondary' as const;
    }
  };

  const handleStatusChange = async (newStatus: DocumentBoxStatus) => {
    setIsPending(true);
    setOpen(false);

    try {
      const result = await updateDocumentBoxStatus(documentBoxId, newStatus);
      if (!result.success) {
        alert(result.error || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Status change error:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setIsPending(false);
    }
  };

  // 변경 가능한 옵션이 없으면 Badge만 표시
  if (options.length === 0) {
    return (
      <Badge variant={getBadgeVariant(currentStatus)}>
        {DOCUMENT_BOX_STATUS_SHORT_LABELS[currentStatus]}
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
            variant={getBadgeVariant(currentStatus)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : null}
            {DOCUMENT_BOX_STATUS_SHORT_LABELS[currentStatus]}
            <ChevronDown className="w-3 h-3 ml-0.5" />
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
