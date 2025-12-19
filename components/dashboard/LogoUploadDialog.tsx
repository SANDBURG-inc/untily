'use client';

import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from 'react';
import { Paperclip, Loader2, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { uploadToS3 } from '@/lib/s3/upload';

interface LogoUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'default' | 'documentBox';
    documentBoxId?: string;
    existingLogoUrl?: string;
    /**
     * 즉시 업로드 완료 시 호출 (S3 업로드 후 URL 반환)
     * onFileSelect가 없을 때 사용됨
     */
    onUploadComplete: (logoUrl: string) => void;
    /**
     * 지연 업로드 모드: 파일 선택만 하고 실제 업로드는 나중에 수행
     * 이 prop이 있으면 즉시 업로드 대신 File 객체와 미리보기 URL만 반환
     */
    onFileSelect?: (file: File, previewUrl: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];

export function LogoUploadDialog({
    open,
    onOpenChange,
    type,
    documentBoxId,
    existingLogoUrl,
    onUploadComplete,
    onFileSelect,
}: LogoUploadDialogProps) {
    // 지연 업로드 모드 여부 (onFileSelect가 있으면 지연 모드)
    const isDeferredMode = !!onFileSelect;
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dialog 열릴 때 기존 로고 URL 설정
    useEffect(() => {
        if (open && existingLogoUrl && !file) {
            setPreviewUrl(existingLogoUrl);
        }
    }, [open, existingLogoUrl]);

    // 파일 변경 시 미리보기 URL 생성
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    const validateFile = (file: File): string | null => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
            return '지원하지 않는 파일 형식입니다. JPG, PNG 파일만 업로드 가능합니다.';
        }
        if (file.size > MAX_FILE_SIZE) {
            return '파일 크기가 10MB를 초과합니다.';
        }
        return null;
    };

    const handleFile = (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            setFile(null);
            return;
        }
        setError(null);
        setFile(file);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFile(droppedFile);
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFile(selectedFile);
        }
    };

    const handleSelectClick = () => {
        fileInputRef.current?.click();
    };

    const handleCancel = () => {
        if (isUploading) return;
        resetState();
        onOpenChange(false);
    };

    const handleSubmit = async () => {
        if (!file || isUploading) return;

        // 지연 업로드 모드: 파일 선택만 하고 즉시 반환
        if (isDeferredMode && onFileSelect && previewUrl) {
            onFileSelect(file, previewUrl);
            // 상태는 유지하되 다이얼로그만 닫음 (미리보기 URL은 유지)
            onOpenChange(false);
            return;
        }

        // 즉시 업로드 모드: S3에 업로드
        setIsUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            // 1. Presigned URL 요청
            const presignedRes = await fetch('/api/logo/presigned', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type || 'image/jpeg',
                    size: file.size,
                    type,
                    documentBoxId: type === 'documentBox' ? documentBoxId : undefined,
                }),
            });

            if (!presignedRes.ok) {
                const errorData = await presignedRes.json();
                throw new Error(errorData.error || 'URL 생성에 실패했습니다.');
            }

            const { uploadUrl, fileUrl } = await presignedRes.json();

            // 2. S3에 업로드
            await uploadToS3({
                uploadUrl,
                file,
                onProgress: setUploadProgress,
            });

            // 3. 기본 로고인 경우 DB에 저장
            if (type === 'default') {
                const saveRes = await fetch('/api/logo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageUrl: fileUrl }),
                });

                if (!saveRes.ok) {
                    const errorData = await saveRes.json();
                    throw new Error(errorData.error || '로고 저장에 실패했습니다.');
                }
            }

            // 4. 완료 콜백 호출
            onUploadComplete(fileUrl);
            resetState();
            onOpenChange(false);
        } catch (err) {
            console.error('Logo upload error:', err);
            setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const resetState = () => {
        setFile(null);
        setPreviewUrl(null);
        setError(null);
        setIsDragging(false);
        setUploadProgress(0);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (isUploading) return;
                if (!isOpen) resetState();
                onOpenChange(isOpen);
            }}
        >
            <DialogContent className="sm:max-w-[656px] p-6 gap-6 rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-left">
                        로고 등록하기
                    </DialogTitle>
                </DialogHeader>

                {/* Drop Zone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        relative flex flex-col items-center justify-center gap-4 p-8 min-h-[200px]
                        border-2 border-dashed rounded-xl
                        bg-slate-100 transition-colors
                        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}
                        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isUploading}
                    />

                    {previewUrl ? (
                        <div className="relative w-full flex items-center justify-center">
                            <img
                                src={previewUrl}
                                alt={file?.name || '로고 미리보기'}
                                className="max-h-[120px] max-w-full object-contain rounded-lg"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setFile(null);
                                    setPreviewUrl(null);
                                }}
                                disabled={isUploading}
                                className="absolute top-0 right-0 p-1 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors"
                            >
                                <X size={16} className="text-slate-600" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-slate-500 text-center">
                                파일을 여기에 드래그 하거나, 직접 선택해주세요.
                            </p>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleSelectClick}
                                disabled={isUploading}
                            >
                                파일선택
                                <Paperclip size={16} />
                            </Button>
                        </>
                    )}
                </div>

                {/* Progress Bar */}
                {isUploading && (
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}

                {/* Constraints */}
                <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                    <li className="text-slate-900">권장사이즈: 608px x 144px</li>
                    <li>최대 파일 크기: 10MB</li>
                    <li>지원 형식: JPG, PNG</li>
                </ul>

                {/* Footer Buttons */}
                <DialogFooter className="grid grid-cols-2 gap-3 sm:gap-3">
                    <Button
                        type="button"
                        variant="soft"
                        onClick={handleCancel}
                        disabled={isUploading}
                        className="h-10 rounded-md"
                    >
                        취소
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!file || isUploading}
                        className="h-10 rounded-md"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                업로드 중...
                            </>
                        ) : (
                            '등록완료'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
