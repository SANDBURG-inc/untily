'use client';

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Paperclip } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';

interface LogoUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];

export function LogoUploadDialog({ open, onOpenChange }: LogoUploadDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        setFile(null);
        setError(null);
        onOpenChange(false);
    };

    const handleSubmit = () => {
        if (!file) return;
        // TODO: 파일 업로드 로직 구현
        console.log('Uploading file:', file);
        onOpenChange(false);
    };

    const resetState = () => {
        setFile(null);
        setError(null);
        setIsDragging(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
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
                        flex flex-col items-center justify-center gap-4 p-8
                        border-2 border-dashed rounded-xl
                        bg-slate-100 transition-colors
                        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {file ? (
                        <p className="text-sm text-slate-700 font-medium">
                            {file.name}
                        </p>
                    ) : (
                        <p className="text-sm text-slate-500 text-center">
                            파일을 여기에 드래그 하거나, 직접 선택해주세요.
                        </p>
                    )}

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSelectClick}
                    >
                        파일선택
                        <Paperclip size={16} />
                    </Button>
                </div>

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
                        className="h-10 rounded-md"
                    >
                        취소
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!file}
                        className="h-10 rounded-md"
                    >
                        등록완료
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
