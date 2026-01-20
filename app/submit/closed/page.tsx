import { XCircle } from 'lucide-react';
import { SubmitStatusCard } from '../_components';

interface ClosedPageProps {
  searchParams: Promise<{ title?: string }>;
}

export default async function ClosedPage({ searchParams }: ClosedPageProps) {
  const { title } = await searchParams;

  return (
    <SubmitStatusCard
      icon={<XCircle className="w-8 h-8 text-muted-foreground" />}
      iconBgClassName="bg-muted"
      title="제출이 마감되었습니다"
    >
      <p>
        {title ? (
          <>
            <span className="font-medium text-foreground">{title}</span>은(는){' '}
          </>
        ) : (
          '해당 문서함은 '
        )}
        더 이상 서류를 받지 않습니다.
        <br />
        담당자에게 문의해 주세요.
      </p>
    </SubmitStatusCard>
  );
}
