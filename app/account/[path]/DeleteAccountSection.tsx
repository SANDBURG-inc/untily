'use client';

import { useState } from 'react';
import { DeleteAccountDialog } from '@/components/settings/DeleteAccountDialog';

export function DeleteAccountSection() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="text-xs text-red-500 hover:text-red-600 hover:underline transition-colors"
      >
        탈퇴하기
      </button>

      <DeleteAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

DeleteAccountSection.displayName = 'DeleteAccountSection';
