'use client';

/**
 * 자동 리마인드 설정 컴포넌트
 *
 * 문서함의 자동 리마인드 기능을 활성화/비활성화하는 토글 스위치와
 * 리마인드 채널 선택 다이얼로그를 제공합니다.
 *
 * @module components/dashboard/AutoReminderSettings
 */

import { useState } from 'react';
import { CheckCircle, Info, Check } from 'lucide-react';
import {
    disableAutoReminder,
    enableAutoReminder,
} from '@/app/dashboard/[id]/actions';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/Button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ReminderChannel, type ReminderChannelType } from '@/lib/types/reminder';

// ============================================================================
// Props Interface
// ============================================================================

interface AutoReminderSettingsProps {
    /** 문서함 ID */
    documentBoxId: string;
    /** 초기 활성화 상태 */
    initialEnabled: boolean;
}

// ============================================================================
// Sub Components
// ============================================================================

/**
 * 리마인드 채널 선택 옵션
 */
interface ChannelOptionProps {
    /** 채널명 */
    label: string;
    /** 선택 가능 여부 */
    enabled: boolean;
    /** 선택됨 여부 */
    selected: boolean;
}

function ChannelOption({ label, enabled, selected }: ChannelOptionProps) {
    const baseStyles =
        'flex items-center gap-3 p-4 border rounded-lg transition-colors';

    if (!enabled) {
        return (
            <div
                className={cn(
                    baseStyles,
                    'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50 select-none'
                )}
            >
                <div className="w-5 h-5 border border-gray-300 rounded bg-white shrink-0" />
                <span className="text-gray-500">{label}</span>
            </div>
        );
    }

    return (
        <label
            className={cn(
                baseStyles,
                'cursor-pointer hover:bg-blue-50',
                selected && 'border-blue-500 bg-blue-50/50'
            )}
        >
            <div
                className={cn(
                    'flex items-center justify-center w-5 h-5 rounded shrink-0',
                    selected ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white'
                )}
            >
                {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </div>
            <span className="text-gray-900 font-medium">{label}</span>
        </label>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function AutoReminderSettings({
    documentBoxId,
    initialEnabled,
}: AutoReminderSettingsProps) {
    // 상태 관리
    const [isEnabled, setIsEnabled] = useState(initialEnabled);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    /**
     * 토글 스위치 변경 핸들러
     * - 활성화 → 비활성화: 바로 처리
     * - 비활성화 → 활성화: 채널 선택 모달 열기
     */
    const handleToggle = async () => {
        if (isPending) return;

        if (isEnabled) {
            // 비활성화 처리
            setIsPending(true);
            const result = await disableAutoReminder(documentBoxId);
            setIsPending(false);

            if (result.success) {
                setIsEnabled(false);
            }
        } else {
            // 활성화 - 채널 선택 모달 열기
            setIsModalOpen(true);
        }
    };

    /**
     * 채널 선택 확인 핸들러
     * 현재 베타 버전에서는 EMAIL만 지원
     */
    const handleConfirm = async () => {
        setIsPending(true);
        const result = await enableAutoReminder(
            documentBoxId,
            ReminderChannel.EMAIL as ReminderChannelType
        );
        setIsPending(false);

        if (result.success) {
            setIsEnabled(true);
            setIsModalOpen(false);
        }
    };

    const closeModal = () => setIsModalOpen(false);

    return (
        <>
            {/* 상태 표시 영역 */}
            <div
                className={cn(
                    'flex items-center justify-between rounded-lg p-4 mb-6 transition-colors',
                    isEnabled
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 border border-gray-200'
                )}
            >
                <div className="flex items-center gap-2">
                    {isEnabled ? (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                    ) : (
                        <Info className="w-5 h-5 text-gray-400" />
                    )}
                    <span
                        className={cn(
                            'text-sm',
                            isEnabled ? 'text-gray-700' : 'text-gray-500'
                        )}
                    >
                        {isEnabled
                            ? '자동 리마인드가 활성화되어 있습니다. 마감일 3일 전에 미제출자에게 자동으로 알림이 발송됩니다.'
                            : '자동 리마인드를 활성화해보세요. 마감일 3일 전에 미제출자에게 자동으로 알림이 발송됩니다.'}
                    </span>
                </div>

                {/* 토글 스위치 */}
                <Switch
                    checked={isEnabled}
                    onCheckedChange={handleToggle}
                    disabled={isPending}
                    aria-label="자동 리마인드 토글"
                />
            </div>

            {/* 채널 선택 다이얼로그 */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900">
                            리마인드 채널 선택
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600 leading-relaxed">
                            마감일 3일 전, 미제출자에게 자동으로 알림을 발송합니다.
                            <br />
                            베타 버전에서는 이메일 리마인드 기능이 지원되며,
                            <br />
                            문자/알림톡이 추후 업데이트 될 예정입니다.
                        </DialogDescription>
                    </DialogHeader>

                    {/* 채널 옵션 목록 */}
                    <div className="space-y-3 py-4">
                        <ChannelOption
                            label="이메일로 발송할게요"
                            enabled={true}
                            selected={true}
                        />
                        <ChannelOption
                            label="문자로 발송할게요"
                            enabled={false}
                            selected={false}
                        />
                        <ChannelOption
                            label="알림톡으로 발송할게요"
                            enabled={false}
                            selected={false}
                        />
                    </div>

                    <DialogFooter className="flex gap-2 sm:flex-row">
                        <Button
                            variant="soft"
                            onClick={closeModal}
                            className="flex-1"
                        >
                            취소
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleConfirm}
                            disabled={isPending}
                            className="flex-1"
                        >
                            {isPending ? '처리중...' : '선택완료'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
