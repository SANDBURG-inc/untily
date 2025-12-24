'use client';

import { X, File } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FilePreviewProps {
  filename: string;
  size?: number;
  onRemove?: () => void;
  isRemoving?: boolean;
  className?: string;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilePreview({
  filename,
  size,
  onRemove,
  isRemoving,
  className = '',
}: FilePreviewProps) {
  return (
    <div className={`flex items-center gap-3 border border-border rounded-md p-3 ${className}`}>
      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
        <File className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-md font-medium text-foreground truncate">{filename}</p>
        {size && <p className="text-xs text-muted-foreground">{formatFileSize(size)}</p>}
      </div>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={isRemoving}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
