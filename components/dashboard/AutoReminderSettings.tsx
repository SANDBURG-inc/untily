'use client';

import { useState } from "react";
import { CheckCircle, Info, X } from "lucide-react";
import { disableAutoReminder, enableAutoReminder } from "@/app/dashboard/[id]/actions";

interface AutoReminderSettingsProps {
    documentBoxId: string;
    initialEnabled: boolean;
}

export function AutoReminderSettings({ documentBoxId, initialEnabled }: AutoReminderSettingsProps) {
    const [isEnabled, setIsEnabled] = useState(initialEnabled);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleToggle = async () => {
        if (isPending) return;

        if (isEnabled) {
            // Turn OFF
            setIsPending(true);
            const result = await disableAutoReminder(documentBoxId);
            setIsPending(false);
            if (result.success) {
                setIsEnabled(false);
            }
        } else {
            // Turn ON -> Open Modal
            setIsModalOpen(true);
        }
    };

    const handleConfirm = async () => {
        // Currently only EMAIL is supported
        setIsPending(true);
        const result = await enableAutoReminder(documentBoxId, "EMAIL");
        setIsPending(false);
        if (result.success) {
            setIsEnabled(true);
            setIsModalOpen(false);
        }
    };

    return (
        <>
            <div className={`flex items-center justify-between rounded-lg p-4 mb-6 transition-colors ${isEnabled ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                }`}>
                <div className="flex items-center gap-2">
                    {isEnabled ? (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                    ) : (
                        <Info className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={`text-sm ${isEnabled ? 'text-gray-700' : 'text-gray-500'}`}>
                        {isEnabled
                            ? "자동 리마인드가 활성화되어 있습니다. 마감일 3일 전에 미제출자에게 자동으로 알림이 발송됩니다."
                            : "자동 리마인드를 활성화해보세요. 마감일 3일 전에 미제출자에게 자동으로 알림이 발송됩니다."
                        }
                    </span>
                </div>

                {/* Toggle Switch */}
                <button
                    onClick={handleToggle}
                    disabled={isPending}
                    className="relative inline-flex items-center cursor-pointer focus:outline-none"
                    aria-label="Toggle auto reminder"
                >
                    <div className={`w-11 h-6 rounded-full transition-colors ${isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}>
                        <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform transform ${isEnabled ? 'translate-x-full border-white' : ''
                            }`}></div>
                    </div>
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-gray-900 mb-2">리마인드 채널 선택</h3>
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                            마감일 3일 전, 미제출자에게 자동으로 알림을 발송합니다.<br />
                            베타 버전에서는 이메일 리마인드 기능이 지원되며,<br />
                            문자/알림톡이 추후 업데이트 될 예정입니다.
                        </p>

                        <div className="space-y-3 mb-8">
                            {/* Email (Active) */}
                            <label className="flex items-center gap-3 p-4 border border-blue-500 bg-blue-50/50 rounded-lg cursor-pointer transition-colors hover:bg-blue-50">
                                <div className="flex items-center justify-center w-5 h-5 bg-blue-600 rounded text-white flex-shrink-0">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-gray-900 font-medium">이메일로 발송할게요</span>
                            </label>

                            {/* SMS (Disabled) */}
                            <label className="flex items-center gap-3 p-4 border border-gray-200 bg-gray-50 rounded-lg cursor-not-allowed opacity-50 select-none">
                                <div className="w-5 h-5 border border-gray-300 rounded bg-white flex-shrink-0"></div>
                                <span className="text-gray-500">문자로 발송할게요</span>
                            </label>

                            {/* Kakao (Disabled) */}
                            <label className="flex items-center gap-3 p-4 border border-gray-200 bg-gray-50 rounded-lg cursor-not-allowed opacity-50 select-none">
                                <div className="w-5 h-5 border border-gray-300 rounded bg-white flex-shrink-0"></div>
                                <span className="text-gray-500">알림톡으로 발송할게요</span>
                            </label>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isPending}
                                className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {isPending ? '처리중...' : '선택완료'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
