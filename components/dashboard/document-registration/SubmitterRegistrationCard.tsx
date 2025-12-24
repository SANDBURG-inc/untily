'use client';

import { Plus, X, Users } from 'lucide-react';
import type { Submitter } from '@/lib/types/document';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { IconButton } from '@/components/shared/IconButton';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { formatPhoneNumberOnInput } from '@/lib/utils/phone';

interface SubmitterRegistrationCardProps {
  /** 제출자 기능 활성화 여부 */
  submittersEnabled: boolean;
  /** 제출자 기능 활성화 변경 핸들러 */
  onSubmittersEnabledChange: (enabled: boolean) => void;
  /** 제출자 목록 */
  submitters: Submitter[];
  /** 제출자 목록 변경 핸들러 */
  onSubmittersChange: (submitters: Submitter[]) => void;
  /** 수정 모드 여부 (수정 모드에서는 Switch가 비활성화됨) */
  isEditMode?: boolean;
}

/**
 * SubmitterRegistrationCard 컴포넌트
 *
 * 서류 제출자 정보를 등록하는 카드 컴포넌트입니다.
 * 제출자의 이름, 이메일, 휴대전화 정보를 입력받습니다.
 */
export function SubmitterRegistrationCard({
  submittersEnabled,
  onSubmittersEnabledChange,
  submitters,
  onSubmittersChange,
  isEditMode = false,
}: SubmitterRegistrationCardProps) {
  /**
   * 새 제출자 추가
   */
  const addSubmitter = () => {
    const newSubmitter: Submitter = {
      id: Date.now().toString(),
      name: '',
      email: '',
      phone: '',
    };
    onSubmittersChange([...submitters, newSubmitter]);
  };

  /**
   * 제출자 정보 업데이트
   * 휴대전화 입력 시 자동으로 하이픈 포맷팅을 적용합니다.
   */
  const updateSubmitter = (id: string, field: keyof Submitter, value: string) => {
    const formattedValue = field === 'phone' ? formatPhoneNumberOnInput(value) : value;

    onSubmittersChange(
      submitters.map((s) => (s.id === id ? { ...s, [field]: formattedValue } : s))
    );
  };

  /**
   * 제출자 삭제
   */
  const removeSubmitter = (id: string) => {
    onSubmittersChange(submitters.filter((s) => s.id !== id));
  };

  return (
    <Card variant="compact" className="mb-6">
      <CardHeader variant="compact">
        <CardTitle>
          <SectionHeader icon={Users} title="서류 제출자 등록" size="md" />
        </CardTitle>
        <CardAction>
          <Switch
            checked={submittersEnabled}
            onCheckedChange={onSubmittersEnabledChange}
            disabled={isEditMode}
          />
        </CardAction>
      </CardHeader>

      <CardContent variant="compact">
        {submittersEnabled ? (
          <div className="space-y-4">
            {submitters.map((submitter) => (
              <div
                key={submitter.id}
                className="relative border border-gray-200 rounded-lg p-4"
              >
                {/* 삭제 버튼 (제출자가 2명 이상일 때만 표시) */}
                {submitters.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSubmitter(submitter.id)}
                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 이름 입력 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      이름<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={submitter.name}
                      onChange={(e) => updateSubmitter(submitter.id, 'name', e.target.value)}
                      placeholder="홍길동"
                      className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                      required={submittersEnabled}
                    />
                  </div>

                  {/* 이메일 입력 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      이메일<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={submitter.email}
                      onChange={(e) => updateSubmitter(submitter.id, 'email', e.target.value)}
                      placeholder="example@email.com"
                      className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                      required={submittersEnabled}
                    />
                  </div>

                  {/* 휴대전화 입력 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      휴대전화<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={submitter.phone}
                      onChange={(e) => updateSubmitter(submitter.id, 'phone', e.target.value)}
                      placeholder="010-0000-0000"
                      className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                      required={submittersEnabled}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* 제출자 추가 버튼 */}
            <IconButton
              type="button"
              variant="secondary"
              icon={<Plus className="w-4 h-4" />}
              onClick={addSubmitter}
              className="w-full"
            >
              제출자 추가
            </IconButton>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            제출 대상이 있는 경우, 버튼을 활성화해주세요.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
