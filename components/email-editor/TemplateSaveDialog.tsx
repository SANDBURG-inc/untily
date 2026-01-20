'use client';

/**
 * 템플릿 저장 다이얼로그
 *
 * 현재 편집한 내용을 새 템플릿으로 저장하거나 기존 템플릿을 업데이트합니다.
 *
 * UX 흐름:
 * - 기존 템플릿이 있으면 "기존 템플릿에 저장"이 기본 선택
 * - "기존 템플릿에 저장": 이름 입력 필드 없음 (바로 저장)
 * - "새 템플릿으로 저장": 기존 이름이 기본값으로 입력됨, 동일 이름 저장 불가
 */

import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

// ============================================================================
// 타입 정의
// ============================================================================

interface Template {
    id: string;
    name: string;
    greetingHtml: string;
    footerHtml: string;
}

interface TemplateSaveDialogProps {
    /** 다이얼로그 열림 상태 */
    open: boolean;
    /** 다이얼로그 상태 변경 핸들러 */
    onOpenChange: (open: boolean) => void;
    /** 저장할 인사말 HTML */
    greetingHtml: string;
    /** 저장할 아랫말 HTML */
    footerHtml: string;
    /** 기존 템플릿 ID (업데이트 시) */
    existingTemplateId?: string | null;
    /** 기존 템플릿 이름 */
    existingTemplateName?: string;
    /** 저장 완료 핸들러 */
    onSaved: (template: Template) => void;
}

export function TemplateSaveDialog({
    open,
    onOpenChange,
    greetingHtml,
    footerHtml,
    existingTemplateId,
    existingTemplateName,
    onSaved,
}: TemplateSaveDialogProps) {
    const [name, setName] = useState('');
    const [saveMode, setSaveMode] = useState<'new' | 'update'>(
        existingTemplateId ? 'update' : 'new'
    );
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 다이얼로그가 열릴 때 초기화
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            // 기존 템플릿이 있으면 update 모드, 없으면 new 모드
            const initialMode = existingTemplateId ? 'update' : 'new';
            setSaveMode(initialMode);
            // new 모드일 때만 기존 이름을 기본값으로 설정
            setName(initialMode === 'new' ? (existingTemplateName || '') : '');
            setError(null);
        }
        onOpenChange(newOpen);
    };

    // 저장 모드 변경 시 이름 초기화
    const handleModeChange = (mode: 'new' | 'update') => {
        setSaveMode(mode);
        setError(null);
        if (mode === 'new') {
            // 새 템플릿으로 저장 시 기존 이름을 기본값으로 (입력 편의)
            setName(existingTemplateName || '');
        } else {
            // 기존 템플릿에 저장 시 이름 필드 필요 없음
            setName('');
        }
    };

    // 저장 처리
    const handleSave = async () => {
        // 새 템플릿: 이름 필수
        if (saveMode === 'new' && !name.trim()) {
            setError('템플릿 이름을 입력해주세요.');
            return;
        }

        // 새 템플릿: 동일 이름 불가
        if (saveMode === 'new' && existingTemplateName && name.trim() === existingTemplateName) {
            setError('기존 템플릿과 다른 이름을 입력해주세요.');
            return;
        }

        setIsPending(true);
        setError(null);

        try {
            let response;

            if (saveMode === 'update' && existingTemplateId) {
                // 기존 템플릿 업데이트 (이름 변경 없이 내용만 업데이트)
                response = await fetch(
                    `/api/remind-template/${existingTemplateId}`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            greetingHtml,
                            footerHtml,
                        }),
                    }
                );
            } else {
                // 새 템플릿 생성
                response = await fetch('/api/remind-template', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name.trim(),
                        greetingHtml,
                        footerHtml,
                    }),
                });
            }

            const data = await response.json();

            if (data.success && data.template) {
                onSaved(data.template);
            } else {
                setError(data.error || '저장에 실패했습니다.');
            }
        } catch {
            setError('저장 중 오류가 발생했습니다.');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Save className="w-5 h-5" />
                        템플릿 저장
                    </DialogTitle>
                    <DialogDescription>
                        현재 편집한 내용을 템플릿으로 저장합니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* 기존 템플릿이 있을 때 저장 모드 선택 */}
                    {existingTemplateId && (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleModeChange('update')}
                                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                        saveMode === 'update'
                                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    기존 템플릿에 저장
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleModeChange('new')}
                                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                        saveMode === 'new'
                                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    새 템플릿으로 저장
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 기존 템플릿에 저장 시: 현재 선택된 템플릿 이름 표시 */}
                    {saveMode === 'update' && existingTemplateName && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">{existingTemplateName}</span> 템플릿에 저장됩니다.
                            </p>
                        </div>
                    )}

                    {/* 새 템플릿으로 저장 시: 이름 입력 */}
                    {(saveMode === 'new' || !existingTemplateId) && (
                        <div className="space-y-2">
                            <label
                                htmlFor="template-name"
                                className="text-sm font-medium text-gray-700"
                            >
                                템플릿 이름
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                id="template-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => {
                                    // 엔터 키로 저장 (IME 조합 중이 아닐 때만)
                                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                        e.preventDefault();
                                        handleSave();
                                    }
                                }}
                                placeholder="템플릿 이름을 입력하세요"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>
                    )}

                    {/* 에러 메시지 */}
                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}
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
                        disabled={isPending}
                        className="flex-1"
                    >
                        {isPending ? '저장 중...' : '저장'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
