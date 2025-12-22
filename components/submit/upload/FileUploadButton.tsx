'use client';

import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FileUploadButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export default function FileUploadButton({
  onClick,
  disabled,
  className = '',
  label = '파일 업로드하기',
}: FileUploadButtonProps) {
  return (
    <Button
      variant="outline"
      className={`w-full ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
      <Upload className="w-4 h-4" />
    </Button>
  );
}
