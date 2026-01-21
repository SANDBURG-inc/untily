'use client';

import { useState, useEffect, useCallback, useMemo, useId } from 'react';
import { Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { TimeSelect } from '@/components/ui/time-select';
import { Button } from '@/components/ui/Button';
import type { DocumentBoxStatus } from '@/lib/types/document';
import { isDocumentBoxClosed, isDocumentBoxLimitedOpen } from '@/lib/types/document';
import { DocumentBoxStatusChangeDialog } from '@/components/shared/DocumentBoxStatusChangeDialog';
import {
    ReminderScheduleDialog,
    formatScheduleSummary,
} from '@/components/dashboard/ReminderScheduleDialog';
import {
    type ReminderScheduleState,
    DEFAULT_REMINDER_SCHEDULE,
} from '@/lib/types/reminder';
import { cn } from '@/lib/utils';

// ============================================================================
// Props Interface
// ============================================================================

interface SubmissionSettingsCardProps {
    /** 제출 마감일 (Date 객체) */
    deadline: Date | undefined;
    /** 제출 마감일 변경 핸들러 */
    onDeadlineChange: (date: Date | undefined) => void;
    /** 리마인드 기능 활성화 여부 */
    reminderEnabled: boolean;
    /** 리마인드 기능 활성화 변경 핸들러 */
    onReminderEnabledChange: (enabled: boolean) => void;
    /** 이메일 리마인드 활성화 여부 */
    emailReminder: boolean;
    /** 이메일 리마인드 활성화 변경 핸들러 */
    onEmailReminderChange: (enabled: boolean) => void;
    /** 제출자 기능 활성화 여부 (비활성화 시 리마인드 기능도 비활성화) */
    submittersEnabled: boolean;
    /** 문서함 현재 상태 (수정 모드에서만 전달) */
    documentBoxStatus?: DocumentBoxStatus;
    /** 초기 마감일 (수정 모드에서 기한 연장 감지용) */
    initialDeadline?: Date;
    /** 기한 연장으로 인한 다시 열기 확인 완료 콜백 */
    onReopenConfirmed?: (confirmed: boolean) => void;
    /** 리마인더 스케줄 목록 (선택적) */
    reminderSchedules?: ReminderScheduleState[];
    /** 리마인더 스케줄 변경 핸들러 (선택적) */
    onReminderSchedulesChange?: (schedules: ReminderScheduleState[]) => void;
}

// ============================================================================
// Sub Components
// ============================================================================

interface ChannelOptionProps {
    label: string;
    enabled: boolean;
    selected: boolean;
    onSelect?: () => void;
}

/**
 * 리마인드 채널 선택 옵션 (AutoReminderSettings 스타일)
 */
function ChannelOption({ label, enabled, selected, onSelect }: ChannelOptionProps) {
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
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                baseStyles,
                'cursor-pointer hover:bg-blue-50 w-full text-left',
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
        </button>
    );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * SubmissionSettingsCard 컴포넌트
 *
 * 제출 옵션을 설정하는 카드 컴포넌트입니다.
 * 제출 마감일과 리마인드 자동 발송 설정을 관리합니다.
 * SectionHeader는 부모 CollapsibleSection에서 렌더링합니다.
 *
 * 수정 모드에서 닫힌 문서함의 기한을 연장하면 "다시 열기" 확인 Dialog를 표시합니다.
 */
export function SubmissionSettingsCard({
    deadline,
    onDeadlineChange,
    reminderEnabled,
    onReminderEnabledChange,
    emailReminder,
    onEmailReminderChange,
    submittersEnabled,
    documentBoxStatus,
    initialDeadline,
    onReopenConfirmed,
    reminderSchedules: externalSchedules,
    onReminderSchedulesChange,
}: SubmissionSettingsCardProps) {
    const uniqueId = useId();

    // 다시 열기 확인 Dialog 상태
    const [showReopenDialog, setShowReopenDialog] = useState(false);
    const [reopenConfirmed, setReopenConfirmed] = useState(false);

    // 과거 날짜 경고 Dialog 상태
    const [showPastDateDialog, setShowPastDateDialog] = useState(false);
    const [pendingPastDate, setPendingPastDate] = useState<Date | undefined>(undefined);

    // 스케줄 설정 Dialog 상태
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);

    // 내부 스케줄 상태 (외부 props가 없을 때 사용)
    const [internalSchedules, setInternalSchedules] = useState<ReminderScheduleState[]>([
        { id: `default-${uniqueId}`, ...DEFAULT_REMINDER_SCHEDULE },
    ]);

    // 실제 사용할 스케줄 (외부 또는 내부)
    const schedules = externalSchedules ?? internalSchedules;
    const setSchedules = onReminderSchedulesChange ?? setInternalSchedules;

    // deadline에서 시간 추출 (HH:mm 형식)
    const selectedTime = useMemo(() => {
        if (!deadline) return '00:00';
        const hours = deadline.getHours().toString().padStart(2, '0');
        const minutes = deadline.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }, [deadline]);

    // 닫힌 상태인지 확인 (CLOSED, CLOSED_EXPIRED, OPEN_SOMEONE)
    const isClosedStatus =
        documentBoxStatus &&
        (isDocumentBoxClosed(documentBoxStatus) || isDocumentBoxLimitedOpen(documentBoxStatus));

    // 기한이 연장되었는지 확인
    const isDeadlineExtended =
        deadline && initialDeadline && deadline.getTime() > initialDeadline.getTime();

    // 과거 시간인지 확인 (현재 시간 기준)
    const isPastDateTime = useCallback((date: Date) => {
        return date.getTime() < Date.now();
    }, []);

    // OPEN 상태인지 확인 (Cron이 CLOSED_EXPIRED로 전환하는 대상)
    const isOpenStatus = documentBoxStatus === 'OPEN';

    // 날짜와 시간을 결합하여 새 Date 생성
    const combineDateTime = useCallback(
        (date: Date, time: string): Date => {
            const [hours, minutes] = time.split(':').map(Number);
            const newDate = new Date(date);
            newDate.setHours(hours, minutes, 0, 0);
            return newDate;
        },
        []
    );

    // 날짜 변경 시 (기존 시간 유지)
    const handleDateChange = useCallback(
        (date: Date | undefined) => {
            if (!date) {
                onDeadlineChange(undefined);
                return;
            }

            // 기존 시간 유지하여 결합
            const newDeadline = combineDateTime(date, selectedTime);

            // OPEN 상태에서만 과거 날짜 경고
            if (isPastDateTime(newDeadline) && isOpenStatus) {
                setPendingPastDate(newDeadline);
                setShowPastDateDialog(true);
                return;
            }

            onDeadlineChange(newDeadline);

            // 닫힌 상태에서 기한이 미래로 연장되면 다시 열기 Dialog 표시
            if (
                isClosedStatus &&
                initialDeadline &&
                newDeadline.getTime() > initialDeadline.getTime() &&
                !isPastDateTime(newDeadline) &&
                !reopenConfirmed
            ) {
                setShowReopenDialog(true);
            }
        },
        [onDeadlineChange, combineDateTime, selectedTime, isClosedStatus, isOpenStatus, initialDeadline, reopenConfirmed, isPastDateTime]
    );

    // 시간 변경 시 (기존 날짜 유지)
    const handleTimeChange = useCallback(
        (time: string) => {
            if (!deadline) return;

            const newDeadline = combineDateTime(deadline, time);

            // OPEN 상태에서만 과거 날짜 경고
            if (isPastDateTime(newDeadline) && isOpenStatus) {
                setPendingPastDate(newDeadline);
                setShowPastDateDialog(true);
                return;
            }

            onDeadlineChange(newDeadline);

            // 닫힌 상태에서 기한이 미래로 연장되면 다시 열기 Dialog 표시
            if (
                isClosedStatus &&
                initialDeadline &&
                newDeadline.getTime() > initialDeadline.getTime() &&
                !isPastDateTime(newDeadline) &&
                !reopenConfirmed
            ) {
                setShowReopenDialog(true);
            }
        },
        [deadline, onDeadlineChange, combineDateTime, isClosedStatus, isOpenStatus, initialDeadline, reopenConfirmed, isPastDateTime]
    );

    // 과거 날짜 확인 처리
    const handlePastDateConfirm = useCallback(() => {
        if (pendingPastDate) {
            onDeadlineChange(pendingPastDate);
        }
        setShowPastDateDialog(false);
        setPendingPastDate(undefined);
    }, [pendingPastDate, onDeadlineChange]);

    // 과거 날짜 취소 처리
    const handlePastDateCancel = useCallback(() => {
        setShowPastDateDialog(false);
        setPendingPastDate(undefined);
    }, []);

    // 다시 열기 확인 처리
    const handleReopenConfirm = useCallback(() => {
        setReopenConfirmed(true);
        setShowReopenDialog(false);
        onReopenConfirmed?.(true);
    }, [onReopenConfirmed]);

    // 다시 열기 취소 처리 (기존 기한으로 복원)
    const handleReopenCancel = useCallback(() => {
        setShowReopenDialog(false);
        if (initialDeadline) {
            onDeadlineChange(initialDeadline);
        }
        onReopenConfirmed?.(false);
    }, [initialDeadline, onDeadlineChange, onReopenConfirmed]);

    // 기한이 다시 줄어들면 reopenConfirmed 리셋
    useEffect(() => {
        if (!isDeadlineExtended && reopenConfirmed) {
            setReopenConfirmed(false);
            onReopenConfirmed?.(false);
        }
    }, [isDeadlineExtended, reopenConfirmed, onReopenConfirmed]);

    // 이메일 채널 토글
    const handleEmailToggle = useCallback(() => {
        onEmailReminderChange(!emailReminder);
    }, [emailReminder, onEmailReminderChange]);

    // 스케줄 저장
    const handleScheduleSave = useCallback(
        (newSchedules: ReminderScheduleState[]) => {
            setSchedules(newSchedules);
        },
        [setSchedules]
    );

    return (
        <>
            {/* 과거 날짜 경고 Dialog */}
            <DocumentBoxStatusChangeDialog
                open={showPastDateDialog}
                onOpenChange={setShowPastDateDialog}
                title="문서함이 자동으로 닫힙니다"
                newStatus="기한 만료"
                newStatusColor="red"
                currentStatus={documentBoxStatus}
                description={
                    <p>
                        제출 마감일을 <strong>과거</strong>로 설정하면 문서함이 자동으로{' '}
                        <strong>기한 만료</strong> 상태로 전환됩니다.
                        닫힌 문서함에서는 더 이상 서류를 제출할 수 없습니다.
                    </p>
                }
                onConfirm={handlePastDateConfirm}
                onCancel={handlePastDateCancel}
            />

            {/* 다시 열기 확인 Dialog */}
            <DocumentBoxStatusChangeDialog
                open={showReopenDialog}
                onOpenChange={setShowReopenDialog}
                title="문서함이 다시 열립니다"
                newStatus="다시 열림"
                newStatusColor="blue"
                currentStatus={documentBoxStatus}
                description={
                    <p>
                        제출 기한을 연장하면 다시 열린 문서함에서 <strong>모든 사용자</strong>가
                        서류를 제출할 수 있습니다.
                    </p>
                }
                onConfirm={handleReopenConfirm}
                onCancel={handleReopenCancel}
            />

            {/* 스케줄 설정 Dialog */}
            <ReminderScheduleDialog
                open={showScheduleDialog}
                onOpenChange={setShowScheduleDialog}
                schedules={schedules}
                onSave={handleScheduleSave}
            />

            <div className="space-y-6">
                {/* 제출 마감일 선택 (날짜 + 시간) */}
                <div>
                    <label className="block text-sm font-normal text-gray-700 mb-2">
                        마감 일시<span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                        <DatePicker
                            date={deadline}
                            onDateChange={handleDateChange}
                            placeholder="날짜 선택"
                        />
                        <TimeSelect
                            value={selectedTime}
                            onValueChange={handleTimeChange}
                            disabled={!deadline}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                        선택한 시간부터 문서함이 닫힙니다
                    </p>
                </div>

                {/* 리마인드 설정 영역 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                리마인드 자동 발송 설정
                            </h3>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                미제출자에게 자동으로 알림을 발송합니다.
                            </p>
                        </div>

                        {/* 리마인드 토글 */}
                        <div className="relative group">
                            <Switch
                                checked={reminderEnabled}
                                onCheckedChange={onReminderEnabledChange}
                                disabled={!submittersEnabled}
                                className="ml-4"
                            />
                            {!submittersEnabled && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    서류 제출자가 없는 경우, 리마인드 기능이 비활성화 됩니다
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 리마인드 활성화 시 상세 설정 */}
                    {reminderEnabled && (
                        <div className="space-y-4 pt-2">
                            {/* 채널 선택 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <ChannelOption
                                    label="이메일로 발송"
                                    enabled={true}
                                    selected={emailReminder}
                                    onSelect={handleEmailToggle}
                                />
                                <ChannelOption
                                    label="문자로 발송"
                                    enabled={false}
                                    selected={false}
                                />
                                <ChannelOption
                                    label="알림톡으로 발송"
                                    enabled={false}
                                    selected={false}
                                />
                            </div>

                            {/* 스케줄 요약 및 설정 버튼 */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <div className="text-[13px] text-gray-700">
                                    <span className="text-gray-500">발송 시점:</span>{' '}
                                    <span className="font-medium">
                                        {formatScheduleSummary(schedules)}
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="soft"
                                    size="sm"
                                    onClick={() => setShowScheduleDialog(true)}
                                >
                                    설정
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
