'use client';

/**
 * 템플릿 저장 다이얼로그
 *
 * 현재 편집한 내용을 새 템플릿으로 저장하거나 기존 템플릿을 업데이트합니다.
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
    /** 템플릿 타입 */
    type: 'SEND' | 'SHARE';
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
    type,
    greetingHtml,
    footerHtml,
    existingTemplateId,
    existingTemplateName,
    onSaved,
}: TemplateSaveDialogProps) {
    const [name, setName] = useState(existingTemplateName || '');
    const [saveMode, setSaveMode] = useState<'new' | 'update'>(
        existingTemplateId ? 'update' : 'new'
    );
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 다이얼로그가 열릴 때 초기화
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setName(existingTemplateName || '');
            setSaveMode(existingTemplateId ? 'update' : 'new');
            setError(null);
        }
        onOpenChange(newOpen);
    };

    // 저장 처리
    const handleSave = async () => {
        if (saveMode === 'new' && !name.trim()) {
            setError('템플릿 이름을 입력해주세요.');
            return;
        }

        setIsPending(true);
        setError(null);

        try {
            let response;

            if (saveMode === 'update' && existingTemplateId) {
                // 기존 템플릿 업데이트
                response = await fetch(
                    `/api/remind-template/${existingTemplateId}`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: name.trim() || existingTemplateName,
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
                        type,
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
                            <label className="text-sm font-medium text-gray-700">
                                저장 방식
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSaveMode('update')}
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
                                    onClick={() => setSaveMode('new')}
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

                    {/* 템플릿 이름 입력 */}
                    <div className="space-y-2">
                        <label
                            htmlFor="template-name"
                            className="text-sm font-medium text-gray-700"
                        >
                            템플릿 이름
                            {saveMode === 'new' && (
                                <span className="text-red-500 ml-1">*</span>
                            )}
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
                            placeholder={
                                saveMode === 'update'
                                    ? existingTemplateName
                                    : '템플릿 이름을 입력하세요'
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {saveMode === 'update' && (
                            <p className="text-xs text-gray-500">
                                비워두면 기존 이름을 유지합니다.
                            </p>
                        )}
                    </div>

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
