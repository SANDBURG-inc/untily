'use client';

/**
 * 리마인더 스케줄 설정 Dialog
 *
 * 문서함 생성/수정 시 리마인더 스케줄을 설정하는 모달입니다.
 * 채널 선택 없이 스케줄 설정만 제공합니다 (이메일 고정).
 *
 * @module components/dashboard/ReminderScheduleDialog
 */

import { useState, useCallback, useId } from 'react';
import { Bell, X } from 'lucide-react';
import { ReminderScheduleEditor } from './ReminderScheduleEditor';
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
import { TimeSelect } from '@/components/ui/time-select';
import {
    type ReminderScheduleState,
    type ReminderTimeUnitType,
    DEFAULT_REMINDER_SCHEDULE,
    MAX_REMINDER_COUNT,
    TIME_UNIT_OPTIONS,
    TIME_VALUE_RANGE,
} from '@/lib/types/reminder';
import { AutoReminderTemplateSelector } from '@/components/email-editor/AutoReminderTemplateSelector';

// ============================================================================
// Props Interface
// ============================================================================

interface ReminderScheduleDialogProps {
    /** Dialog 열림 상태 */
    open: boolean;
    /** Dialog 열림 상태 변경 핸들러 */
    onOpenChange: (open: boolean) => void;
    /** 현재 스케줄 목록 */
    schedules: ReminderScheduleState[];
    /** 저장 핸들러 */
    onSave: (schedules: ReminderScheduleState[], autoTemplateId: string | null) => void;
    /** 자동 리마인더 템플릿 ID */
    autoTemplateId?: string | null;
}

// ============================================================================
// Sub Components
// ============================================================================

export interface ReminderScheduleRowProps {
    schedule: ReminderScheduleState;
    onChange: (schedule: ReminderScheduleState) => void;
    onDelete: () => void;
    canDelete: boolean;
}

/**
 * 리마인더 스케줄 행
 * 구글 캘린더 스타일의 "마감 n일|주 전 HH:mm" 형식
 */
export function ReminderScheduleRow({
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

            <span className="text-sm text-gray-600 shrink-0">전</span>

            {/* 시간 선택 */}
            <TimeSelect
                value={schedule.sendTime}
                onValueChange={(value) => onChange({ ...schedule, sendTime: value })}
                size="sm"
            />

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

export function ReminderScheduleDialog({
    open,
    onOpenChange,
    schedules: initialSchedules,
    onSave,
    autoTemplateId: initialAutoTemplateId = null,
}: ReminderScheduleDialogProps) {
    const uniqueId = useId();

    // Dialog 내부에서 수정 중인 스케줄 상태
    const [localSchedules, setLocalSchedules] = useState<ReminderScheduleState[]>(
        initialSchedules.length > 0
            ? initialSchedules
            : [{ id: `new-${uniqueId}-0`, ...DEFAULT_REMINDER_SCHEDULE }]
    );

    // 템플릿 ID 상태
    const [localAutoTemplateId, setLocalAutoTemplateId] = useState<string | null>(
        initialAutoTemplateId
    );

    // Dialog가 열릴 때마다 초기값으로 리셋
    const handleOpenChange = useCallback(
        (newOpen: boolean) => {
            if (newOpen) {
                setLocalSchedules(
                    initialSchedules.length > 0
                        ? initialSchedules
                        : [{ id: `new-${uniqueId}-0`, ...DEFAULT_REMINDER_SCHEDULE }]
                );
                setLocalAutoTemplateId(initialAutoTemplateId);
            }
            onOpenChange(newOpen);
        },
        [initialSchedules, initialAutoTemplateId, onOpenChange, uniqueId]
    );

    // 스케줄 추가
    const handleAddSchedule = useCallback(() => {
        if (localSchedules.length >= MAX_REMINDER_COUNT) return;

        setLocalSchedules((prev) => [
            ...prev,
            {
                id: `new-${uniqueId}-${Date.now()}`,
                timeValue: 1,
                timeUnit: 'DAY',
                sendTime: '09:00',
            },
        ]);
    }, [localSchedules.length, uniqueId]);

    // 스케줄 수정
    const handleUpdateSchedule = useCallback(
        (index: number, updated: ReminderScheduleState) => {
            setLocalSchedules((prev) => prev.map((s, i) => (i === index ? updated : s)));
        },
        []
    );

    // 스케줄 삭제
    const handleDeleteSchedule = useCallback((index: number) => {
        setLocalSchedules((prev) => prev.filter((_, i) => i !== index));
    }, []);

    // 저장
    const handleSave = useCallback(() => {
        if (localSchedules.length === 0) return;
        onSave(localSchedules, localAutoTemplateId);
        onOpenChange(false);
    }, [localSchedules, localAutoTemplateId, onSave, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        리마인드 설정
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                        마감일 기준으로 미제출자에게 자동으로 알림을 발송합니다.
                    </DialogDescription>
                </DialogHeader>

                <ReminderScheduleEditor
                    schedules={localSchedules}
                    onAddSchedule={handleAddSchedule}
                    onUpdateSchedule={handleUpdateSchedule}
                    onDeleteSchedule={handleDeleteSchedule}
                />

                {/* 템플릿 선택 */}
                <div className="border-t pt-4">
                    <AutoReminderTemplateSelector
                        type="SEND"
                        selectedId={localAutoTemplateId}
                        onSelect={setLocalAutoTemplateId}
                    />
                </div>

                <DialogFooter className="flex gap-2 sm:flex-row">
                    <Button
                        variant="soft"
                        onClick={() => onOpenChange(false)}
                        className="flex-1"
                    >
                        취소
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={localSchedules.length === 0}
                        className="flex-1"
                    >
                        저장
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 스케줄 목록을 요약 텍스트로 변환
 * @example formatScheduleSummary([{ timeValue: 3, timeUnit: 'DAY', sendTime: '09:00' }])
 * // => "마감 3일 전 09:00"
 */
export function formatScheduleSummary(schedules: ReminderScheduleState[]): string {
    if (schedules.length === 0) return '';

    const first = schedules[0];
    const unitLabel = first.timeUnit === 'DAY' ? '일' : '주';
    const base = `마감 ${first.timeValue}${unitLabel} 전 ${first.sendTime}`;

    if (schedules.length > 1) {
        return `${base} 외 ${schedules.length - 1}건`;
    }

    return base;
}
