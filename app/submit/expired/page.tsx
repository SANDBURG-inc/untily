import { AlertTriangle } from 'lucide-react';
import { SubmitStatusCard } from '../_components';

interface ExpiredPageProps {
  searchParams: Promise<{ title?: string }>;
}

export default async function ExpiredPage({ searchParams }: ExpiredPageProps) {
  const { title } = await searchParams;

  return (
    <SubmitStatusCard
      icon={<AlertTriangle className="w-8 h-8 text-destructive" />}
      iconBgClassName="bg-destructive/10"
      title="제출 기한이 만료되었습니다"
    >
      <p>
        {title ? (
          <>
            <span className="font-medium text-foreground">{title}</span>의{' '}
          </>
        ) : (
          '해당 문서함의 '
        )}
        제출 기한이 지났습니다.
        <br />
        담당자에게 문의해 주세요.
      </p>
    </SubmitStatusCard>
  );
}
