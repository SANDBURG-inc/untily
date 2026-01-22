'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MarkdownViewer } from '@/components/shared/MarkdownViewer';
import { privacyPolicy } from '@/content';

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyModal({ open, onOpenChange }: PrivacyPolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>개인정보 처리방침</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <MarkdownViewer content={privacyPolicy} className="prose-sm" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

PrivacyPolicyModal.displayName = 'PrivacyPolicyModal';
