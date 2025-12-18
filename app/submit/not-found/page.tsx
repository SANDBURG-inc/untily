import { FileQuestion } from 'lucide-react';
import { SubmitStatusCard } from '../_components';

export default function SubmitNotFoundPage() {
  return (
    <SubmitStatusCard
      icon={<FileQuestion className="w-8 h-8 text-muted-foreground" />}
      iconBgClassName="bg-muted"
      title="페이지를 찾을 수 없습니다"
    >
      <p>
        요청하신 문서함 또는 제출자 정보를 찾을 수 없습니다.
        <br />
        링크가 올바른지 확인해 주세요.
      </p>
    </SubmitStatusCard>
  );
}
