/**
 * @fileoverview 제출자(Submitter) 전용 인증 모듈
 *
 * 이 파일은 서류 제출자의 인증을 처리합니다.
 * 일반 사용자 인증과 달리, 제출자는 이메일 링크를 통해 접근하며
 * 해당 이메일로 로그인해야만 서류를 제출할 수 있습니다.
 *
 * @remarks
 * - 서버 전용 모듈입니다 (import "server-only")
 * - 일반 사용자 인증은 `@/lib/auth`를 사용하세요
 * - 클라이언트 인증은 `@/lib/auth/client`를 사용하세요
 *
 * @example 제출자 인증 검증
 * ```tsx
 * import { validateSubmitterAuth } from '@/lib/auth/submitter-auth';
 *
 * export default async function SubmitPage({ params }) {
 *   const result = await validateSubmitterAuth(documentBoxId, submitterId);
 *
 *   switch (result.status) {
 *     case 'success': return <UploadForm />;
 *     case 'not_authenticated': return <LoginPrompt />;
 *     case 'email_mismatch': return <EmailMismatchView />;
 *     case 'not_found': redirect('/submit/not-found');
 *     case 'expired': redirect('/submit/expired');
 *   }
 * }
 * ```
 *
 * @see {@link file://@/lib/auth.ts} 일반 사용자 서버 인증
 * @see {@link file://@/lib/auth/client.ts} 클라이언트 인증
 * @module lib/auth/submitter-auth
 */
import "server-only";

import { neonAuth } from '@neondatabase/neon-js/auth/next';
import prisma from '@/lib/db';
import type { DocumentBox, RequiredDocument, Submitter, SubmitterStatus, SubmittedDocument } from '@/lib/generated/prisma/client';
import type { AuthenticatedUser } from '@/lib/auth';
import { getLogoForDocumentBox } from '@/lib/queries/logo';

/**
 * Neon Auth 사용자 타입
 *
 * @deprecated AuthenticatedUser를 사용하세요. 하위 호환성을 위해 유지됩니다.
 * @see {@link AuthenticatedUser}
 */
export type NeonAuthUser = AuthenticatedUser;

/**
 * 제출자 인증 결과 타입
 */
export type SubmitterAuthResult =
  | { status: 'success'; user: NeonAuthUser; submitter: SubmitterWithDocumentBox; logoUrl: string }
  | { status: 'not_authenticated'; submitter: SubmitterWithDocumentBox; logoUrl: string }
  | { status: 'email_mismatch'; user: NeonAuthUser; submitter: SubmitterWithDocumentBox; logoUrl: string }
  | { status: 'not_found' }
  | { status: 'expired'; documentBox: DocumentBox };

/**
 * DocumentBox, RequiredDocument, SubmittedDocument를 포함한 Submitter 타입
 */
export type SubmitterWithDocumentBox = Submitter & {
  documentBox: DocumentBox & {
    requiredDocuments: RequiredDocument[];
  };
  submittedDocuments: SubmittedDocument[];
};

/**
 * 제출자 인증 및 유효성 검증
 *
 * 검증 순서:
 * 1. 문서함 존재 여부 확인
 * 2. 문서함 만료 여부 확인
 * 3. 제출자 존재 여부 확인
 * 4. Neon Auth 로그인 여부 확인
 * 5. 이메일 일치 여부 확인
 * 6. userId 연결 (최초 로그인 시)
 *
 * @param documentBoxId 문서함 ID
 * @param submitterId 제출자 ID
 * @returns SubmitterAuthResult
 */
export async function validateSubmitterAuth(
  documentBoxId: string,
  submitterId: string
): Promise<SubmitterAuthResult> {
  // 1. 문서함 조회 (제출자, 필수서류, 제출서류 포함)
  const documentBox = await prisma.documentBox.findUnique({
    where: { documentBoxId },
    include: {
      submitters: {
        include: {
          submittedDocuments: true,
        },
      },
      requiredDocuments: true,
    },
  });

  if (!documentBox) {
    return { status: 'not_found' };
  }

  // 2. 만료 체크
  if (new Date() > documentBox.endDate) {
    return { status: 'expired', documentBox };
  }

  // 3. 제출자 확인
  const submitter = documentBox.submitters.find(
    (s) => s.submitterId === submitterId
  );

  if (!submitter) {
    return { status: 'not_found' };
  }

  // SubmitterWithDocumentBox 형태로 조합
  const submitterWithDocBox: SubmitterWithDocumentBox = {
    ...submitter,
    documentBox: {
      ...documentBox,
      requiredDocuments: documentBox.requiredDocuments,
    },
    submittedDocuments: submitter.submittedDocuments,
  };

  // 4. 로고 URL 조회
  const logoUrl = await getLogoForDocumentBox(documentBoxId);

  // 5. Neon Auth 로그인 확인
  const { user } = await neonAuth();

  if (!user) {
    return { status: 'not_authenticated', submitter: submitterWithDocBox, logoUrl };
  }

  // 6. 이메일 일치 확인 (대소문자 무시)
  const userEmail = user.email?.toLowerCase();
  const submitterEmail = submitter.email.toLowerCase();

  if (userEmail !== submitterEmail) {
    return { status: 'email_mismatch', user: user as NeonAuthUser, submitter: submitterWithDocBox, logoUrl };
  }

  // 7. userId 연결 (최초 로그인 시)
  if (!submitter.userId) {
    await prisma.submitter.update({
      where: { submitterId },
      data: { userId: user.id },
    });
    // 업데이트된 정보 반영
    submitterWithDocBox.userId = user.id;
  }

  return { status: 'success', user: user as NeonAuthUser, submitter: submitterWithDocBox, logoUrl };
}

/**
 * 제출 완료 후 상태 업데이트
 *
 * @param submitterId 제출자 ID
 * @returns 업데이트된 Submitter
 */
export async function markSubmitterAsSubmitted(submitterId: string) {
  return await prisma.submitter.update({
    where: { submitterId },
    data: {
      status: 'SUBMITTED' as SubmitterStatus,
      submittedAt: new Date(),
    },
  });
}

/**
 * 제출자 상태 조회
 *
 * @param submitterId 제출자 ID
 * @returns 제출자 상태 정보
 */
export async function getSubmitterStatus(submitterId: string) {
  const submitter = await prisma.submitter.findUnique({
    where: { submitterId },
    select: {
      status: true,
      submittedAt: true,
    },
  });

  return submitter;
}
