import { validatePublicSubmitAuth } from '@/lib/auth/public-submit-auth';
import { redirect } from 'next/navigation';
import { ClipboardCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import CompleteActions from '@/app/submit/[documentBoxId]/[submitterId]/complete/_components/CompleteActions';

interface PublicCompletePageProps {
  params: Promise<{ documentBoxId: string }>;
}

export default async function PublicCompletePage({ params }: PublicCompletePageProps) {
  const { documentBoxId } = await params;

  const result = await validatePublicSubmitAuth(documentBoxId);

  // 인증 실패 케이스들 → 랜딩으로
  if (result.status !== 'success') {
    redirect(`/submit/${documentBoxId}`);
  }

  // 아직 제출 안 한 경우 → 업로드로
  if (result.submitter.status !== 'SUBMITTED') {
    redirect(`/submit/${documentBoxId}/upload`);
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardContent className="py-12 text-center">
          {/* 클립보드 체크 아이콘 */}
          <div className="flex justify-center mb-6">
            <ClipboardCheck className="w-16 h-16 text-green-600" strokeWidth={1.5} />
          </div>

          {/* 문서함 제목 */}
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {result.submitter.documentBox.boxTitle}
          </h1>

          {/* 안내 메시지 */}
          <div className="mb-8">
            <p className="text-base text-muted-foreground mb-1">
              제출이 완료되었습니다.
            </p>
            <p className="text-base text-muted-foreground">
              담당자가 확인 후 연락드릴 예정입니다.
            </p>
          </div>

          {/* 버튼 영역 */}
          <CompleteActions />

          {/* 하단 안내 */}
          <p className="text-sm text-muted-foreground mt-8">
            제출한 문서는 안전하게 보관됩니다.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
