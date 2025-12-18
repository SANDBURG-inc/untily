'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Image } from 'lucide-react';
import { IconButton } from '@/components/shared/IconButton';
import { LogoUploadDialog } from './LogoUploadDialog';

interface DashboardHeaderActionsProps {
    existingLogoUrl?: string;
}

export function DashboardHeaderActions({ existingLogoUrl }: DashboardHeaderActionsProps) {
    const router = useRouter();
    const [logoDialogOpen, setLogoDialogOpen] = useState(false);

    const handleUploadComplete = () => {
        router.refresh();
    };

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
                type="default"
                existingLogoUrl={existingLogoUrl}
                onUploadComplete={handleUploadComplete}
            />
        </div>
    );
}
