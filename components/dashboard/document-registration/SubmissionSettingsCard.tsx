'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Checkbox } from '@/components/ui/checkbox';
import type { DocumentBoxStatus } from '@/lib/types/document';
import { isDocumentBoxClosed, isDocumentBoxLimitedOpen } from '@/lib/types/document';
import { DocumentBoxStatusChangeDialog } from '@/components/shared/DocumentBoxStatusChangeDialog';

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
}

/**
 * SubmissionSettingsCard 컴포넌트
 *
 * 제출 옵션을 설정하는 카드 컴포넌트입니다.
 * 제출 마감일과 리마인드 자동 발송 설정을 관리합니다.
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
}: SubmissionSettingsCardProps) {
  // 다시 열기 확인 Dialog 상태
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [reopenConfirmed, setReopenConfirmed] = useState(false);

  // 과거 날짜 경고 Dialog 상태
  const [showPastDateDialog, setShowPastDateDialog] = useState(false);
  const [pendingPastDate, setPendingPastDate] = useState<Date | undefined>(undefined);

  // 닫힌 상태인지 확인 (CLOSED, CLOSED_EXPIRED, OPEN_SOMEONE)
  const isClosedStatus =
    documentBoxStatus &&
    (isDocumentBoxClosed(documentBoxStatus) || isDocumentBoxLimitedOpen(documentBoxStatus));

  // 기한이 연장되었는지 확인
  const isDeadlineExtended =
    deadline && initialDeadline && deadline.getTime() > initialDeadline.getTime();

  // 과거 날짜인지 확인 (오늘 자정 기준)
  const isPastDate = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  }, []);

  // OPEN 상태인지 확인 (Cron이 CLOSED_EXPIRED로 전환하는 대상)
  // OPEN_SOMEONE, OPEN_RESUME는 특수 상태로 마감 후에도 전환되지 않음
  const isOpenStatus = documentBoxStatus === 'OPEN';

  // 기한 변경 시 Dialog 표시 로직
  const handleDeadlineChange = useCallback(
    (date: Date | undefined) => {
      // OPEN 상태에서만 과거 날짜 경고 (Cron이 CLOSED_EXPIRED로 전환)
      // OPEN_SOMEONE, OPEN_RESUME는 특수 상태로 경고 불필요
      if (date && isPastDate(date) && isOpenStatus) {
        setPendingPastDate(date);
        setShowPastDateDialog(true);
        return;
      }

      onDeadlineChange(date);

      // 닫힌 상태에서 기한이 미래로 연장되면 다시 열기 Dialog 표시
      // 조건: 닫힌 상태 + 초기 마감일보다 연장 + 미래 날짜 (현재 시점 이후)
      if (
        isClosedStatus &&
        date &&
        initialDeadline &&
        date.getTime() > initialDeadline.getTime() &&
        !isPastDate(date) &&  // 미래 날짜여야 다시 열림
        !reopenConfirmed
      ) {
        setShowReopenDialog(true);
      }
    },
    [onDeadlineChange, isClosedStatus, isOpenStatus, initialDeadline, reopenConfirmed, isPastDate]
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
    // 기존 기한으로 복원
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

  return (
    <>
    {/* 과거 날짜 경고 Dialog (OPEN 상태에서만 표시) */}
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

    <Card variant="compact" className="mb-8">
      <CardHeader variant="compact">
        <CardTitle>
          <SectionHeader icon={Settings} title="제출 옵션 설정" size="md" />
        </CardTitle>
      </CardHeader>

      <CardContent variant="compact">
        <div className="space-y-6">
          {/* 제출 마감일 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              제출 마감일<span className="text-red-500">*</span>
            </label>
            <DatePicker
              date={deadline}
              onDateChange={handleDeadlineChange}
              placeholder="제출 마감일을 선택해주세요"
            />
          </div>

          {/* 리마인드 설정 영역 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  리마인드 자동 발송 설정
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-1">
                  마감일 3일 전, 미제출자에게 자동으로 알림을 발송합니다.
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  현재 버전에서는 이메일만 지원하며, 추후 문자/알림톡 지원이 업데이트될
                  예정입니다.
                </p>
              </div>

              {/* 리마인드 토글 (제출자가 없으면 비활성화) */}
              <div className="relative group">
                <Switch
                  checked={reminderEnabled}
                  onCheckedChange={onReminderEnabledChange}
                  disabled={!submittersEnabled}
                  className="ml-4"
                />
                {/* 비활성화 시 툴팁 표시 */}
                {!submittersEnabled && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    서류 제출자가 없는 경우, 리마인드 기능이 비활성화 됩니다
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
                  </div>
                )}
              </div>
            </div>

            {/* 리마인드 채널 선택 (리마인드 활성화 시에만 표시) */}
            {reminderEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {/* 이메일 (활성화 가능) */}
                <label
                  className="flex items-center gap-2 px-4 py-2.5 border-2 rounded-lg cursor-pointer transition-all"
                  style={{
                    borderColor: emailReminder ? '#3B82F6' : '#E5E7EB',
                    backgroundColor: emailReminder ? '#EFF6FF' : 'white',
                  }}
                >
                  <Checkbox
                    checked={emailReminder}
                    onCheckedChange={(checked) => onEmailReminderChange(checked === true)}
                  />
                  <span className="text-sm text-gray-700">이메일로 발송할게요</span>
                </label>

                {/* 문자 (비활성화 - 추후 지원 예정) */}
                <label
                  className="flex items-center gap-2 px-4 py-2.5 border-2 rounded-lg cursor-not-allowed transition-all opacity-50"
                  style={{
                    borderColor: '#E5E7EB',
                    backgroundColor: '#F9FAFB',
                  }}
                >
                  <Checkbox checked={false} disabled />
                  <span className="text-sm text-gray-500">문자로 발송할게요</span>
                </label>

                {/* 알림톡 (비활성화 - 추후 지원 예정) */}
                <label
                  className="flex items-center gap-2 px-4 py-2.5 border-2 rounded-lg cursor-not-allowed transition-all opacity-50"
                  style={{
                    borderColor: '#E5E7EB',
                    backgroundColor: '#F9FAFB',
                  }}
                >
                  <Checkbox checked={false} disabled />
                  <span className="text-sm text-gray-500">알림톡으로 발송할게요</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
