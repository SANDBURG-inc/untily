'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function CompleteActions() {
  const router = useRouter();

  const handleClose = () => {
    router.push('/');
  };

  return (
    <div className="space-y-3">
      <Button className="w-full" size="lg" disabled>
        PDF로 제출 정보 다운받기
      </Button>
      <Button variant="outline" className="w-full" size="lg" onClick={handleClose}>
        닫기
      </Button>
    </div>
  );
}
