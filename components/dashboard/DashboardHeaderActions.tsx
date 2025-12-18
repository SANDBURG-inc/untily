'use client';

import { useState } from 'react';
import { Plus, Image } from 'lucide-react';
import { IconButton } from '@/components/shared/IconButton';
import { LogoUploadDialog } from './LogoUploadDialog';

export function DashboardHeaderActions() {
    const [logoDialogOpen, setLogoDialogOpen] = useState(false);

    return (
        <div className="flex items-center gap-2">
            <IconButton
                variant="secondary"
                icon={<Image size={16} />}
                onClick={() => setLogoDialogOpen(true)}
            >
                기본 로고 등록
            </IconButton>
            <IconButton
                as="link"
                href="/dashboard/register"
                variant="primary"
                icon={<Plus size={16} />}
            >
                문서함 등록
            </IconButton>

            <LogoUploadDialog
                open={logoDialogOpen}
                onOpenChange={setLogoDialogOpen}
            />
        </div>
    );
}
