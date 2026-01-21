'use client';

import { useOptimistic, useTransition } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { toggleSubmitterChecked } from '@/app/dashboard/[id]/actions';

interface CheckedToggleProps {
    documentBoxId: string;
    submitterId: string;
    isChecked: boolean;
}

/**
 * 제출자 확인 체크박스 (낙관적 UI 적용)
 *
 * 관리자가 제출물을 확인했는지 여부를 표시
 */
export function CheckedToggle({
    documentBoxId,
    submitterId,
    isChecked,
}: CheckedToggleProps) {
    const [isPending, startTransition] = useTransition();

    // 낙관적 UI
    const [optimisticChecked, setOptimisticChecked] = useOptimistic(
        isChecked,
        (_current, newChecked: boolean) => newChecked
    );

    const handleToggle = () => {
        startTransition(async () => {
            setOptimisticChecked(!optimisticChecked);

            try {
                const result = await toggleSubmitterChecked(documentBoxId, submitterId);
                if (!result.success) {
                    alert(result.error || '확인 상태 변경에 실패했습니다.');
                }
            } catch (error) {
                console.error('Toggle checked error:', error);
                alert('확인 상태 변경 중 오류가 발생했습니다.');
            }
        });
    };

    return (
        <Checkbox
            checked={optimisticChecked}
            onCheckedChange={handleToggle}
            disabled={isPending}
            aria-label="확인 완료"
        />
    );
}
