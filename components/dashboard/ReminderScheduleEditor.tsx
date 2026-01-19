'use client';

/**
 * 리마인더 스케줄 편집기 공통 컴포넌트
 *
 * ReminderScheduleDialog와 AutoReminderSettings에서 공통으로 사용되는
 * 스케줄 목록 UI를 추출한 컴포넌트입니다.
 *
 * @module components/dashboard/ReminderScheduleEditor
 */

import { Plus } from 'lucide-react';
import { ReminderScheduleRow } from './ReminderScheduleDialog';
import {
    type ReminderScheduleState,
    MAX_REMINDER_COUNT,
} from '@/lib/types/reminder';

// ============================================================================
// Props Interface
// ============================================================================

interface ReminderScheduleEditorProps {
    /** 스케줄 목록 */
    schedules: ReminderScheduleState[];
    /** 스케줄 추가 핸들러 */
    onAddSchedule: () => void;
    /** 스케줄 수정 핸들러 */
    onUpdateSchedule: (index: number, updated: ReminderScheduleState) => void;
    /** 스케줄 삭제 핸들러 */
    onDeleteSchedule: (index: number) => void;
    /** 최대 스케줄 개수 (기본값: MAX_REMINDER_COUNT) */
    maxCount?: number;
    /** Beta 배너 표시 여부 (기본값: true) */
    showBetaBanner?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * 리마인더 스케줄 편집기
 *
 * Beta 배너, 스케줄 목록, 추가 버튼을 포함하는 공통 UI 컴포넌트입니다.
 */
export function ReminderScheduleEditor({
    schedules,
    onAddSchedule,
    onUpdateSchedule,
    onDeleteSchedule,
    maxCount = MAX_REMINDER_COUNT,
    showBetaBanner = true,
}: ReminderScheduleEditorProps) {
    return (
        <>
            {/* Beta 안내 배너 */}
            {showBetaBanner && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-600">
                    Beta 기간동안 무료로 제공됩니다.
                </div>
            )}

            {/* 리마인더 스케줄 목록 */}
            <div className="py-2">
                <div className="space-y-1">
                    {schedules.map((schedule, index) => (
                        <ReminderScheduleRow
                            key={schedule.id}
                            schedule={schedule}
                            onChange={(updated) => onUpdateSchedule(index, updated)}
                            onDelete={() => onDeleteSchedule(index)}
                            canDelete={schedules.length > 1}
                        />
                    ))}
                </div>

                {/* 리마인더 추가 버튼 */}
                {schedules.length < maxCount && (
                    <button
                        type="button"
                        onClick={onAddSchedule}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 py-2 mt-1"
                    >
                        <Plus className="w-4 h-4" />
                        리마인더 추가
                    </button>
                )}
            </div>
        </>
    );
}
