import { ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';

interface SubmitStatusCardProps {
  icon: ReactNode;
  iconBgClassName?: string;
  title: string;
  children: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  maxWidth?: 'sm' | 'md' | 'lg';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function SubmitStatusCard({
  icon,
  iconBgClassName = 'bg-muted',
  title,
  children,
  actionLabel = '홈으로 돌아가기',
  actionHref = '/',
  maxWidth = 'md',
}: SubmitStatusCardProps) {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <Card className={`${maxWidthClasses[maxWidth]} w-full`}>
        <CardContent className="pt-8 pb-8 text-center">
          {/* 아이콘 */}
          <div
            className={`w-16 h-16 ${iconBgClassName} rounded-full flex items-center justify-center mx-auto mb-6`}
          >
            {icon}
          </div>

          {/* 제목 */}
          <h1 className="text-xl font-bold text-foreground mb-3">{title}</h1>

          {/* 내용 */}
          <div className="text-muted-foreground mb-6">{children}</div>

          {/* 액션 버튼 */}
          <Button variant="secondary" asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
