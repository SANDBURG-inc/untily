'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import type { DocumentBoxStatus } from '@/lib/types/document';
import { DOCUMENT_BOX_STATUS_LABELS } from '@/lib/types/document';

interface DocumentBoxStatusChangeDialogProps {
  /** Dialog 열림 상태 */
  open: boolean;
  /** Dialog 열림 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** Dialog 제목 */
  title: string;
  /** 현재 문서함 상태 (선택적 - 표시할 경우에만) */
  currentStatus?: DocumentBoxStatus;
  /** 변경될 상태 텍스트 (예: "다시 열림", "일부 제출 가능") */
  newStatus: string;
  /** 변경될 상태의 색상 (기본: blue) */
  newStatusColor?: 'blue' | 'red' | 'orange' | 'green';
  /** 추가 설명 (자유 형식) */
  description?: React.ReactNode;
  /** 확인 버튼 텍스트 (기본: "확인") */
  confirmText?: string;
  /** 확인 버튼 클릭 핸들러 */
  onConfirm: () => void;
  /** 취소 버튼 클릭 핸들러 */
  onCancel: () => void;
}

/**
 * DocumentBoxStatusChangeDialog
 *
 * 문서함 상태 변경을 확인하는 Dialog 컴포넌트입니다.
 * 기한 연장, 과거 날짜 설정, 마감 후 리마인드 발송 등
 * 문서함 상태가 변경되는 상황에서 사용합니다.
 */
export function DocumentBoxStatusChangeDialog({
  open,
  onOpenChange,
  title,
  currentStatus,
  newStatus,
  newStatusColor = 'blue',
  description,
  confirmText = '확인',
  onConfirm,
  onCancel,
}: DocumentBoxStatusChangeDialogProps) {
  // 상태 색상 클래스
  const statusColorClass = {
    blue: 'text-blue-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
    green: 'text-green-600',
  }[newStatusColor];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-3 text-muted-foreground text-base">
              {/* 상태 변경 안내 */}
              <p>
                문서함 상태가 <strong className={statusColorClass}>{newStatus}</strong>
                (으)로 변경됩니다.
              </p>

              {/* 현재 상태 표시 (있는 경우) */}
              {currentStatus && (
                <p>
                  현재 문서함 상태:{' '}
                  <strong className="text-foreground">
                    {DOCUMENT_BOX_STATUS_LABELS[currentStatus]}
                  </strong>
                </p>
              )}

              {/* 추가 설명 */}
              {description && (
                <div className="text-sm text-muted-foreground">{description}</div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onCancel}>
            취소
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
