'use client';

import { Save, Loader2 } from 'lucide-react';
import { IconButton } from '@/components/shared/IconButton';
import type { VariantProps } from 'class-variance-authority';
import type { buttonVariants } from '@/components/ui/Button';

interface SaveButtonProps extends Omit<VariantProps<typeof buttonVariants>, 'variant'> {
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  label?: string;
}

export function SaveButton({
  onClick,
  disabled,
  isLoading,
  className,
  size = 'sm',
  label = '저장',
}: SaveButtonProps) {
  return (
    <IconButton
      variant="default"
      size={size}
      icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      iconPosition="left"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={className}
    >
      {label}
    </IconButton>
  );
}
