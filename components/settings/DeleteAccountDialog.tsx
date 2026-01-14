'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { authClient } from '@/lib/auth/client';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '회원 탈퇴 중 오류가 발생했습니다.');
      }

      await authClient.signOut();
      router.push('/');
    } catch (err) {
      console.error('Delete account error:', err);
      setError(err instanceof Error ? err.message : '회원 탈퇴 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">회원 탈퇴</DialogTitle>
          <DialogDescription className="pt-4 space-y-2 text-gray-600">
            <p>탈퇴 시 이전 제출내역이 모두 삭제됩니다.</p>
            <p className="text-sm text-gray-500">
              단, 이미 제출한 자료는 삭제되지 않습니다.
            </p>
            <p className="pt-2 font-medium text-gray-900">
              회원탈퇴에 동의하십니까?
            </p>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '탈퇴 중...' : '탈퇴'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

DeleteAccountDialog.displayName = 'DeleteAccountDialog';
