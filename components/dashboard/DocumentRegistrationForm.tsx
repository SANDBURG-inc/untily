'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, FileText, Users, Settings, ChevronDown, Loader2 } from 'lucide-react';
import type { Submitter, DocumentRequirement } from '@/lib/types/document';
import { PageHeader } from '@/components/shared/PageHeader';
import { Switch } from '@/components/ui/switch';

interface DocumentBoxInitialData {
    documentName: string;
    description: string;
    submittersEnabled: boolean;
    submitters: Submitter[];
    requirements: DocumentRequirement[];
    deadline: string;
    reminderEnabled: boolean;
    emailReminder: boolean;
    smsReminder: boolean;
    kakaoReminder: boolean;
}

interface DocumentRegistrationFormProps {
    mode?: 'create' | 'edit';
    documentBoxId?: string;
    initialData?: DocumentBoxInitialData;
}

export default function DocumentRegistrationForm({
    mode = 'create',
    documentBoxId,
    initialData,
}: DocumentRegistrationFormProps) {
    const router = useRouter();
    const isEditMode = mode === 'edit';

    // Basic Information
    const [documentName, setDocumentName] = useState(initialData?.documentName || '');
    const [description, setDescription] = useState(initialData?.description || '');

    // Submitter Registration
    const [submittersEnabled, setSubmittersEnabled] = useState(initialData?.submittersEnabled ?? true);
    const [submitters, setSubmitters] = useState<Submitter[]>(
        initialData?.submitters || [{ id: '1', name: '', email: '', phone: '' }]
    );

    // Document Requirements
    const [requirements, setRequirements] = useState<DocumentRequirement[]>(
        initialData?.requirements || [{ id: '1', name: '', type: '필수', description: '' }]
    );

    // Submission Settings
    const [deadline, setDeadline] = useState(initialData?.deadline || '');
    const [reminderEnabled, setReminderEnabled] = useState(initialData?.reminderEnabled ?? true);
    const [emailReminder, setEmailReminder] = useState(initialData?.emailReminder ?? true);
    const [smsReminder, setSmsReminder] = useState(initialData?.smsReminder ?? false);
    const [kakaoReminder, setKakaoReminder] = useState(initialData?.kakaoReminder ?? false);

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addSubmitter = () => {
        const newSubmitter: Submitter = {
            id: Date.now().toString(),
            name: '',
            email: '',
            phone: ''
        };
        setSubmitters([...submitters, newSubmitter]);
    };

    const updateSubmitter = (id: string, field: keyof Submitter, value: string) => {
        let formattedValue = value;

        // Auto-format phone number with hyphens
        if (field === 'phone') {
            // Remove all non-digit characters
            const numbers = value.replace(/[^0-9]/g, '');

            // Format as XXX-XXXX-XXXX
            if (numbers.length <= 3) {
                formattedValue = numbers;
            } else if (numbers.length <= 7) {
                formattedValue = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
            } else if (numbers.length <= 11) {
                formattedValue = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
            } else {
                formattedValue = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
            }
        }

        setSubmitters(submitters.map(s =>
            s.id === id ? { ...s, [field]: formattedValue } : s
        ));
    };

    const addRequirement = () => {
        const newRequirement: DocumentRequirement = {
            id: Date.now().toString(),
            name: '',
            type: '필수',
            description: ''
        };
        setRequirements([...requirements, newRequirement]);
    };

    const updateRequirement = (id: string, field: keyof DocumentRequirement, value: string) => {
        setRequirements(requirements.map(r =>
            r.id === id ? { ...r, [field]: value } : r
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const payload = {
                documentName,
                description,
                submittersEnabled,
                submitters: submitters.map(({ id, ...rest }) => rest),
                requirements: requirements.map(({ id, ...rest }) => rest),
                deadline,
                reminderEnabled,
                emailReminder,
                smsReminder,
                kakaoReminder,
            };

            const url = isEditMode ? `/api/document-box/${documentBoxId}` : '/api/document-box';
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || (isEditMode ? '문서함 수정에 실패했습니다' : '문서함 생성에 실패했습니다'));
            }

            // Success - redirect to dashboard or detail page
            if (isEditMode && documentBoxId) {
                router.push(`/dashboard/${documentBoxId}`);
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            console.error(isEditMode ? 'Error updating document box:' : 'Error creating document box:', err);
            setError(err instanceof Error ? err.message : (isEditMode ? '문서함 수정 중 오류가 발생했습니다' : '문서함 생성 중 오류가 발생했습니다'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isEditMode && documentBoxId) {
            router.push(`/dashboard/${documentBoxId}`);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            {/* Header */}
            <PageHeader
                title={isEditMode ? '문서함 수정' : '문서함 등록'}
                description={
                    isEditMode
                        ? '문서함 정보를 수정하세요.'
                        : '문서함 등록하고, 필요한 서류를 쉽게 취합해보세요!'
                }
                align="center"
            />

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Basic Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
                <div className="flex items-center gap-2 mb-6">
                    <FileText className="w-5 h-5 text-gray-700" />
                    <h2 className="text-base font-semibold text-gray-900">기본 정보 입력</h2>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            문서함 이름<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={documentName}
                            onChange={(e) => setDocumentName(e.target.value)}
                            placeholder="예: 2024년 연말정산 서류 제출"
                            className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            설명
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="문서함에 대한 간단한 설명을 입력하세요"
                            rows={3}
                            className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-gray-400"
                        />
                    </div>
                </div>
            </div>

            {/* Submitter Registration */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-700" />
                        <h2 className="text-base font-semibold text-gray-900">서류 제출자 등록</h2>
                    </div>
                    <Switch
                        checked={submittersEnabled}
                        onCheckedChange={(checked) => {
                            setSubmittersEnabled(checked);
                            if (!checked) {
                                setReminderEnabled(false);
                            }
                        }}
                    />
                </div>

                {submittersEnabled ? (
                    <div className="space-y-4">
                        {submitters.map((submitter, index) => (
                            <div key={submitter.id} className="relative border border-gray-200 rounded-lg p-4">
                                {submitters.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setSubmitters(submitters.filter(s => s.id !== submitter.id))}
                                        className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                        <button
                            type="button"
                            onClick={addSubmitter}
                            className="w-full py-2.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            제출자 추가
                        </button>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-8">
                        제출 대상이 있는 경우, 버튼을 활성화해주세요.
                    </p>
                )}
            </div>

            {/* Document Requirements */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
                <div className="flex items-center gap-2 mb-6">
                    <FileText className="w-5 h-5 text-gray-700" />
                    <h2 className="text-base font-semibold text-gray-900">수집 서류 등록</h2>
                </div>

                <div className="space-y-4">
                    {requirements.map((requirement, index) => (
                        <div key={requirement.id} className="relative border border-gray-200 rounded-lg p-4">
                            {requirements.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setRequirements(requirements.filter(r => r.id !== requirement.id))}
                                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        서류명<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={requirement.name}
                                        onChange={(e) => updateRequirement(requirement.id, 'name', e.target.value)}
                                        placeholder="예: 주민등록등본"
                                        className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        서류 유형<span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={requirement.type}
                                            onChange={(e) => updateRequirement(requirement.id, 'type', e.target.value)}
                                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white appearance-none pr-10 text-gray-700"
                                            required
                                        >
                                            <option value="필수">필수</option>
                                            <option value="옵션">옵션</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    설명
                                </label>
                                <input
                                    type="text"
                                    value={requirement.description}
                                    onChange={(e) => updateRequirement(requirement.id, 'description', e.target.value)}
                                    placeholder="예: 3개월 이내 발급"
                                    className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addRequirement}
                        className="w-full py-2.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" />
                        서류 추가
                    </button>
                </div>
            </div>

            {/* Submission Settings */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <div className="flex items-center gap-2 mb-6">
                    <Settings className="w-5 h-5 text-gray-700" />
                    <h2 className="text-base font-semibold text-gray-900">제출 옵션 설정</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            제출 마감일<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            placeholder="제출 마감일을 선택해주세요"
                            className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                            required
                        />
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-gray-900 mb-1">리마인드 자동 발송 설정</h3>
                                <p className="text-xs text-gray-600 leading-relaxed mb-1">
                                    마감일 3일 전, 미제출자에게 자동으로 알림을 발송합니다.
                                </p>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    현재 버전에서는 이메일만 지원하며, 추후 문자/알림톡 지원이 업데이트될 예정입니다.
                                </p>
                            </div>
                            <div className="relative group">
                                <Switch
                                    checked={reminderEnabled}
                                    onCheckedChange={setReminderEnabled}
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

                        {reminderEnabled && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                <label className="flex items-center gap-2 px-4 py-2.5 border-2 rounded-lg cursor-pointer transition-all" style={{
                                    borderColor: emailReminder ? '#3B82F6' : '#E5E7EB',
                                    backgroundColor: emailReminder ? '#EFF6FF' : 'white'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={emailReminder}
                                        onChange={(e) => setEmailReminder(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">이메일로 발송할게요</span>
                                </label>

                                <label className="flex items-center gap-2 px-4 py-2.5 border-2 rounded-lg cursor-not-allowed transition-all opacity-50" style={{
                                    borderColor: '#E5E7EB',
                                    backgroundColor: '#F9FAFB'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={false}
                                        disabled
                                        className="w-4 h-4 text-gray-400 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-500">문자로 발송할게요</span>
                                </label>

                                <label className="flex items-center gap-2 px-4 py-2.5 border-2 rounded-lg cursor-not-allowed transition-all opacity-50" style={{
                                    borderColor: '#E5E7EB',
                                    backgroundColor: '#F9FAFB'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={false}
                                        disabled
                                        className="w-4 h-4 text-gray-400 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-500">알림톡으로 발송할게요</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="flex-1 py-3 text-sm border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    취소
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting
                        ? (isEditMode ? '수정 중...' : '생성 중...')
                        : (isEditMode ? '수정완료' : '문서함 생성')}
                </button>
            </div>
        </form>
    );
}
