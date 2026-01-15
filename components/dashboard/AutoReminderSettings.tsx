'use client';

/**
 * 자동 리마인드 설정 컴포넌트
 *
 * 문서함의 자동 리마인드 기능을 설정하는 토글 스위치와
 * 리마인드 스케줄 설정 다이얼로그를 제공합니다.
 * 구글 캘린더 스타일의 리마인더 설정 UI를 사용합니다.
 *
 * @module components/dashboard/AutoReminderSettings
 */

import { useState, useCallback, useId } from 'react';
import { CheckCircle, Info, Check, Bell, Plus, X } from 'lucide-react';
import {
    saveReminderSchedules,
    disableAutoReminderV2,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    ReminderChannel,
    type ReminderChannelType,
    type ReminderScheduleState,
    type ReminderTimeUnitType,
    DEFAULT_REMINDER_SCHEDULE,
    MAX_REMINDER_COUNT,
    SEND_TIME_OPTIONS,
    TIME_UNIT_OPTIONS,
    TIME_VALUE_RANGE,
} from '@/lib/types/reminder';

// ============================================================================
// Props Interface
// ============================================================================

interface AutoReminderSettingsProps {
    /** 문서함 ID */
    documentBoxId: string;
    /** 초기 활성화 상태 */
    initialEnabled: boolean;
    /** 초기 스케줄 목록 */
    initialSchedules?: {
        id: string;
        timeValue: number;
        timeUnit: 'DAY' | 'WEEK';
        sendTime: string;
    }[];
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
        'flex items-center gap-3 p-3 border rounded-lg transition-colors';

    if (!enabled) {
        return (
            <div
                className={cn(
                    baseStyles,
                    'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50 select-none'
                )}
            >
                <div className="w-5 h-5 border border-gray-300 rounded bg-white shrink-0" />
                <span className="text-gray-500 text-sm">{label}</span>
                <span className="ml-auto text-xs text-gray-400">준비중</span>
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
            <span className="text-gray-900 font-medium text-sm">{label}</span>
        </label>
    );
}

/**
 * 리마인더 스케줄 행 (구글 캘린더 스타일)
 */
interface ReminderScheduleRowProps {
    schedule: ReminderScheduleState;
    onChange: (schedule: ReminderScheduleState) => void;
    onDelete: () => void;
    canDelete: boolean;
}

function ReminderScheduleRow({
    schedule,
    onChange,
    onDelete,
    canDelete,
}: ReminderScheduleRowProps) {
    const timeRange = TIME_VALUE_RANGE[schedule.timeUnit as keyof typeof TIME_VALUE_RANGE];
    const timeValues = Array.from(
        { length: timeRange.max - timeRange.min + 1 },
        (_, i) => timeRange.min + i
    );

    return (
        <div className="flex items-center gap-2 py-2">
            {/* 마감 라벨 */}
            <span className="text-sm text-gray-600 shrink-0">마감</span>

            {/* 숫자 선택 */}
            <Select
                value={String(schedule.timeValue)}
                onValueChange={(value) =>
                    onChange({ ...schedule, timeValue: Number(value) })
                }
            >
                <SelectTrigger className="w-16 h-9">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {timeValues.map((v) => (
                        <SelectItem key={v} value={String(v)}>
                            {v}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* 단위 선택 */}
            <Select
                value={schedule.timeUnit}
                onValueChange={(value: ReminderTimeUnitType) => {
                    const newRange = TIME_VALUE_RANGE[value];
                    const newValue = Math.min(
                        Math.max(schedule.timeValue, newRange.min),
                        newRange.max
                    );
                    onChange({ ...schedule, timeUnit: value, timeValue: newValue });
                }}
            >
                <SelectTrigger className="w-16 h-9">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {TIME_UNIT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* 전 라벨 */}
            <span className="text-sm text-gray-600 shrink-0">전</span>

            {/* 시간 선택 */}
            <Select
                value={schedule.sendTime}
                onValueChange={(value) => onChange({ ...schedule, sendTime: value })}
            >
                <SelectTrigger className="w-24 h-9">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                    {SEND_TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                            {time}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* 삭제 버튼 */}
            {canDelete && (
                <button
                    type="button"
                    onClick={onDelete}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-auto"
                    aria-label="리마인더 삭제"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function AutoReminderSettings({
    documentBoxId,
    initialEnabled,
    initialSchedules = [],
}: AutoReminderSettingsProps) {
    const uniqueId = useId();

    // 초기 스케줄 설정
    const getInitialSchedules = (): ReminderScheduleState[] => {
        if (initialSchedules.length > 0) {
            return initialSchedules.map((s) => ({
                id: s.id,
                timeValue: s.timeValue,
                timeUnit: s.timeUnit,
                sendTime: s.sendTime,
            }));
        }
        return [{ id: `new-${uniqueId}-0`, ...DEFAULT_REMINDER_SCHEDULE }];
    };

    // 상태 관리
    const [isEnabled, setIsEnabled] = useState(initialEnabled);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [schedules, setSchedules] = useState<ReminderScheduleState[]>(getInitialSchedules);

    /**
     * 토글 스위치 변경 핸들러
     * - 활성화 → 비활성화: 바로 처리
     * - 비활성화 → 활성화: 설정 모달 열기
     */
    const handleToggle = async () => {
        if (isPending) return;

        if (isEnabled) {
            // 비활성화 처리
            setIsPending(true);
            const result = await disableAutoReminderV2(documentBoxId);
            setIsPending(false);

            if (result.success) {
                setIsEnabled(false);
                setSchedules([{ id: `new-${uniqueId}-0`, ...DEFAULT_REMINDER_SCHEDULE }]);
            }
        } else {
            // 활성화 - 설정 모달 열기
            setIsModalOpen(true);
        }
    };

    /**
     * 스케줄 추가
     */
    const handleAddSchedule = useCallback(() => {
        if (schedules.length >= MAX_REMINDER_COUNT) return;

        setSchedules((prev) => [
            ...prev,
            {
                id: `new-${uniqueId}-${Date.now()}`,
                timeValue: 1,
                timeUnit: 'DAY',
                sendTime: '09:00',
            },
        ]);
    }, [schedules.length, uniqueId]);

    /**
     * 스케줄 수정
     */
    const handleUpdateSchedule = useCallback(
        (index: number, updated: ReminderScheduleState) => {
            setSchedules((prev) => prev.map((s, i) => (i === index ? updated : s)));
        },
        []
    );

    /**
     * 스케줄 삭제
     */
    const handleDeleteSchedule = useCallback((index: number) => {
        setSchedules((prev) => prev.filter((_, i) => i !== index));
    }, []);

    /**
     * 저장
     */
    const handleSave = async () => {
        if (schedules.length === 0) return;

        setIsPending(true);
        const result = await saveReminderSchedules(
            documentBoxId,
            schedules.map((s) => ({
                timeValue: s.timeValue,
                timeUnit: s.timeUnit as ReminderTimeUnitType,
                sendTime: s.sendTime,
                channel: ReminderChannel.EMAIL as ReminderChannelType,
            }))
        );
        setIsPending(false);

        if (result.success) {
            setIsEnabled(true);
            setIsModalOpen(false);
        }
    };

    /**
     * 모달 닫기
     */
    const closeModal = () => {
        setIsModalOpen(false);
        // 모달 닫을 때 초기 상태로 복원
        setSchedules(getInitialSchedules());
    };

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
                            ? '자동 리마인드가 활성화되어 있습니다.'
                            : '자동 리마인드를 활성화해보세요.'}
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

            {/* 설정 다이얼로그 */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            리마인드 설정
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600">
                            마감일 기준으로 미제출자에게 자동으로 알림을 발송합니다.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Beta 안내 배너 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-600">
                        Beta 기간동안 무료로 제공됩니다.
                    </div>

                    {/* 리마인더 스케줄 목록 */}
                    <div className="py-2">
                        <div className="space-y-1">
                            {schedules.map((schedule, index) => (
                                <ReminderScheduleRow
                                    key={schedule.id}
                                    schedule={schedule}
                                    onChange={(updated) => handleUpdateSchedule(index, updated)}
                                    onDelete={() => handleDeleteSchedule(index)}
                                    canDelete={schedules.length > 1}
                                />
                            ))}
                        </div>

                        {/* 리마인더 추가 버튼 */}
                        {schedules.length < MAX_REMINDER_COUNT && (
                            <button
                                type="button"
                                onClick={handleAddSchedule}
                                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 py-2 mt-1"
                            >
                                <Plus className="w-4 h-4" />
                                리마인더 추가
                            </button>
                        )}
                    </div>

                    {/* 채널 선택 */}
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">채널 선택</h4>
                        <div className="space-y-2">
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
                    </div>

                    <DialogFooter className="flex gap-2 sm:flex-row">
                        <Button variant="soft" onClick={closeModal} className="flex-1">
                            취소
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={isPending || schedules.length === 0}
                            className="flex-1"
                        >
                            {isPending ? '저장중...' : '저장'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
