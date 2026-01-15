'use client';

import { useState } from 'react';
import { TermsModal } from './TermsModal';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { cn } from '@/lib/utils';

interface LegalLinksProps {
  className?: string;
  linkClassName?: string;
  showDivider?: boolean;
  dividerClassName?: string;
}

export function LegalLinks({
  className,
  linkClassName,
  showDivider = true,
  dividerClassName,
}: LegalLinksProps) {
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        <button
          type="button"
          onClick={() => setTermsOpen(true)}
          className={cn(
            'text-gray-500 hover:text-gray-700 hover:underline transition-colors',
            linkClassName
          )}
        >
          이용약관
        </button>
        {showDivider && (
          <span className={cn('text-gray-300', dividerClassName)}>|</span>
        )}
        <button
          type="button"
          onClick={() => setPrivacyOpen(true)}
          className={cn(
            'text-gray-500 hover:text-gray-700 hover:underline transition-colors',
            linkClassName
          )}
        >
          개인정보처리방침
        </button>
      </div>

      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
      <PrivacyPolicyModal open={privacyOpen} onOpenChange={setPrivacyOpen} />
    </>
  );
}

LegalLinks.displayName = 'LegalLinks';
