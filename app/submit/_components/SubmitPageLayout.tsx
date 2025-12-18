import { ReactNode } from 'react';

interface SubmitPageLayoutProps {
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | '2xl';
  hasFooter?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  '2xl': 'max-w-2xl',
};

export function SubmitPageLayout({
  children,
  footer,
  maxWidth = '2xl',
  hasFooter = false,
}: SubmitPageLayoutProps) {
  return (
    <div className="flex-1 flex flex-col">
      <main
        className={`flex-1 ${maxWidthClasses[maxWidth]} mx-auto w-full px-4 py-8 ${
          hasFooter ? 'mb-24' : ''
        }`}
      >
        {children}
      </main>
      {footer}
    </div>
  );
}
