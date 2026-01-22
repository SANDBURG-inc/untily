import { validatePublicSubmitAuth } from '@/lib/auth/public-submit-auth';
import { handlePublicAuthRedirects } from '@/lib/auth/submit-redirect';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import PublicCheckoutView from './_components/PublicCheckoutView';

interface PublicCheckoutPageProps {
  params: Promise<{ documentBoxId: string }>;
}

export default async function PublicCheckoutPage({ params }: PublicCheckoutPageProps) {
  const { documentBoxId } = await params;

  const result = await validatePublicSubmitAuth(documentBoxId);

  // 문서함 없음, 공개 제출 아님, 만료됨, 미인증 → 리다이렉트
  const { submitter, user } = handlePublicAuthRedirects(result, documentBoxId);

  // 로그인한 사용자의 프로필 정보 조회 (User 테이블)
  const userProfile = user ? await prisma.user.findUnique({
    where: { authUserId: user.id },
    select: { name: true, phone: true },
  }) : null;

  // 이미 제출 완료된 경우 → complete로
  if (submitter.status === 'SUBMITTED') {
    redirect(`/submit/${documentBoxId}/complete`);
  }

  // 업로드된 파일이 없으면 upload로 리다이렉트
  if (submitter.submittedDocuments.length === 0) {
    redirect(`/submit/${documentBoxId}/upload`);
  }

  // 인증 완료 → 체크아웃 뷰 표시
  return (
    <PublicCheckoutView
      documentBox={{
        boxTitle: submitter.documentBox.boxTitle,
        requiredDocuments: submitter.documentBox.requiredDocuments.map((doc) => ({
          requiredDocumentId: doc.requiredDocumentId,
          documentTitle: doc.documentTitle,
          documentDescription: doc.documentDescription,
          isRequired: doc.isRequired,
        })),
      }}
      submitter={{
        name: submitter.name,
        email: submitter.email,
        phone: submitter.phone,
        submitterId: submitter.submitterId,
        submittedDocuments: submitter.submittedDocuments.map((doc) => ({
          submittedDocumentId: doc.submittedDocumentId,
          requiredDocumentId: doc.requiredDocumentId,
          filename: doc.filename,
          originalFilename: doc.originalFilename,
          size: doc.size,
        })),
      }}
      userProfile={userProfile}
      documentBoxId={documentBoxId}
    />
  );
}
