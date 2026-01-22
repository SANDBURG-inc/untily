'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';

interface ProfileUpdateDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  updatedFields: {
    name?: string;
    phone?: string;
  } | null;
}

export default function ProfileUpdateDialog({
  open,
  onConfirm,
  onCancel,
  updatedFields,
}: ProfileUpdateDialogProps) {
  const getFieldList = () => {
    const fields: string[] = [];
    if (updatedFields?.name) fields.push('이름');
    if (updatedFields?.phone) fields.push('연락처');
    return fields;
  };

  const fields = getFieldList();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>기본 프로필 정보도 변경할까요?</DialogTitle>
          <DialogDescription>
            {fields.length > 0 && (
              <span className="block mt-2">
                변경 항목: <strong>{fields.join(', ')}</strong>
              </span>
            )}
            <span className="block mt-2 text-muted-foreground">
              프로필 정보를 변경하면 다음 제출 시에도 변경된 정보가 자동으로 입력됩니다.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onCancel}>
            이번만 사용
          </Button>
          <Button onClick={onConfirm}>
            프로필에 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
