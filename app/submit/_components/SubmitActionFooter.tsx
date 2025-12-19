'use client';

import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SubmitActionFooterProps {
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  primaryDisabled?: boolean;
  secondaryDisabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
}

export function SubmitActionFooter({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryDisabled = false,
  secondaryDisabled = false,
  isLoading = false,
  loadingLabel = '처리 중...',
}: SubmitActionFooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-4">
      <div className="max-w-2xl mx-auto flex gap-3">
        {secondaryLabel && onSecondary && (
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={onSecondary}
            disabled={secondaryDisabled || isLoading}
          >
            {secondaryLabel}
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          onClick={onPrimary}
          disabled={primaryDisabled || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              <span>{loadingLabel}</span>
            </>
          ) : (
            primaryLabel
          )}
        </Button>
      </div>
    </footer>
  );
}
