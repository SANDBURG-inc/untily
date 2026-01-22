'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MarkdownViewer } from '@/components/shared/MarkdownViewer';
import { termsOfService } from '@/content';

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsModal({ open, onOpenChange }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>서비스 이용약관</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <MarkdownViewer content={termsOfService} className="prose-sm" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

TermsModal.displayName = 'TermsModal';
