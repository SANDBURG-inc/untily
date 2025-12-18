import { SubmitHeader } from '@/components/submit/SubmitHeader';

interface SubmitLayoutProps {
  children: React.ReactNode;
}

export default function SubmitLayout({ children }: SubmitLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col text-base">
      <SubmitHeader />
      {children}
    </div>
  );
}
