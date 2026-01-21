'use client';

import { useOptimistic, useState, useTransition, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
    Alert,
    AlertDescription,
} from '@/components/ui/alert';
import {
    type SubmittedSubmitterStatus,
    SUBMITTER_STATUS_LABELS,
    getSubmitterStatusChangeOptions,
} from '@/lib/types/submitter';
import { updateSubmitterStatus } from '@/app/dashboard/[id]/actions';

interface SubmitterStatusDropdownProps {
    documentBoxId: string;
    submitterId: string;
    currentStatus: SubmittedSubmitterStatus;
}

/**
 * 제출자 상태 변경 드롭다운 (낙관적 UI 적용)
 *
 * SUBMITTED <-> REJECTED 간 상태 변경 가능
 * 반려로 변경 시 Alert 표시
 */
export function SubmitterStatusDropdown({
    documentBoxId,
    submitterId,
    currentStatus,
}: SubmitterStatusDropdownProps) {
    const [open, setOpen] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [alertPosition, setAlertPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);

    // 낙관적 UI
    const [optimisticStatus, setOptimisticStatus] = useOptimistic(
        currentStatus,
        (_current, newStatus: SubmittedSubmitterStatus) => newStatus
    );

    const options = getSubmitterStatusChangeOptions(optimisticStatus);

    // 상태별 Badge variant
    const getBadgeVariant = (status: SubmittedSubmitterStatus) => {
        return status === 'SUBMITTED' ? 'success' as const : 'destructive' as const;
    };

    // Alert 위치 업데이트
    useEffect(() => {
        if (showAlert && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setAlertPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
            });
        }
    }, [showAlert]);

    const handleStatusChange = (newStatus: SubmittedSubmitterStatus) => {
        setOpen(false);

        // 반려로 변경 시 Alert 표시
        if (newStatus === 'REJECTED') {
            setShowAlert(true);
            // 5초 후 자동으로 Alert 숨김
            setTimeout(() => setShowAlert(false), 5000);
        }

        startTransition(async () => {
            setOptimisticStatus(newStatus);

            try {
                const result = await updateSubmitterStatus(documentBoxId, submitterId, newStatus);
                if (!result.success) {
                    alert(result.error || '상태 변경에 실패했습니다.');
                }
            } catch (error) {
                console.error('Status change error:', error);
                alert('상태 변경 중 오류가 발생했습니다.');
            }
        });
    };

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild disabled={isPending}>
                    <button
                        ref={triggerRef}
                        className="inline-flex items-center gap-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                        disabled={isPending}
                    >
                        <Badge
                            variant={getBadgeVariant(optimisticStatus)}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            {SUBMITTER_STATUS_LABELS[optimisticStatus]}
                            <ChevronDown className="w-3 h-3 ml-0.5" />
                        </Badge>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[140px]">
                    {options.map((option) => (
                        <DropdownMenuItem
                            key={option.to}
                            onClick={() => handleStatusChange(option.to)}
                            className="cursor-pointer"
                        >
                            <span className="font-medium">{option.label}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {showAlert && typeof document !== 'undefined' && createPortal(
                <Alert
                    className="fixed w-80 z-50 bg-white shadow-lg border"
                    style={{ top: alertPosition.top, left: alertPosition.left }}
                >
                    <AlertDescription className="text-xs block">
                        알림기능은 준비중입니다. 필요시 <strong>리마인드</strong> 또는 링크 재공유 부탁드립니다.
                    </AlertDescription>
                </Alert>,
                document.body
            )}
        </>
    );
}
