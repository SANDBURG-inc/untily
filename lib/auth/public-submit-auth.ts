/**
 * @fileoverview 공개 제출(Public Submit) 전용 인증 모듈
 *
 * 이 파일은 지정 제출자 없이 공개적으로 서류를 수집하는 문서함의 인증을 처리합니다.
 * (hasSubmitter=false인 DocumentBox)
 *
 * 일반 제출자 인증과의 차이점:
 * - 이메일 매칭 불필요 (로그인만 확인)
 * - Submitter가 미리 생성되어 있지 않음 (로그인 시 자동 생성)
 * - URL에 submitterId가 없음 (/submit/[documentBoxId])
 *
 * @remarks
 * - 서버 전용 모듈입니다 (import "server-only")
 * - 지정 제출자 인증은 `@/lib/auth/submitter-auth`를 사용하세요
 *
 * @example 공개 제출 인증 검증
 * ```tsx
 * import { validatePublicSubmitAuth } from '@/lib/auth/public-submit-auth';
 *
 * export default async function PublicSubmitPage({ params }) {
 *   const result = await validatePublicSubmitAuth(documentBoxId);
 *
 *   switch (result.status) {
 *     case 'success': return <UploadForm />;
 *     case 'not_authenticated': return <LoginPrompt />;
 *     case 'not_found': redirect('/submit/not-found');
 *     case 'closed': redirect('/submit/closed');
 *     case 'expired': redirect('/submit/expired');
 *     case 'not_public': redirect('/submit/not-found');
 *   }
 * }
 * ```
 *
 * @see {@link file://@/lib/auth/submitter-auth.ts} 지정 제출자 인증
 * @module lib/auth/public-submit-auth
 */
import "server-only";

import { neonAuth } from '@neondatabase/neon-js/auth/next';
import prisma from '@/lib/db';
import type { DocumentBox, RequiredDocument, SubmittedDocument } from '@/lib/generated/prisma/client';
import type { AuthenticatedUser } from '@/lib/auth';
import { hasDesignatedSubmitters } from '@/lib/utils/document-box';
import { SubmitterWithDocumentBox, NeonAuthUser } from './submitter-auth';
import { getLogoForDocumentBox } from '@/lib/queries/logo';
import { isDocumentBoxOpen, isDocumentBoxClosed, isDocumentBoxLimitedOpen } from '@/lib/types/document';

/**
 * 필수서류를 포함한 DocumentBox 타입
 */
export type DocumentBoxWithRequiredDocs = DocumentBox & {
  requiredDocuments: RequiredDocument[];
};

/**
 * 로고 URL을 포함한 DocumentBox 타입
 */
export type DocumentBoxWithLogo = DocumentBoxWithRequiredDocs & {
  logoUrl: string;
};

/**
 * 공개 제출 인증 결과 타입
 */
export type PublicSubmitAuthResult =
  | { status: 'success'; user: NeonAuthUser; submitter: SubmitterWithDocumentBox; logoUrl: string }
  | { status: 'not_authenticated'; documentBox: DocumentBoxWithLogo }
  | { status: 'not_found' }
  | { status: 'closed'; documentBox: DocumentBox }
  | { status: 'expired'; documentBox: DocumentBox }
  | { status: 'not_public'; documentBox: DocumentBox };

/**
 * 공개 제출 인증 및 유효성 검증
 *
 * 검증 순서:
 * 1. 문서함 존재 여부 확인
 * 2. 문서함 상태 확인 (CLOSED인 경우 제출 불가)
 * 3. 공개 제출 문서함 여부 확인 (hasSubmitter=false)
 * 4. 문서함 만료 여부 확인
 * 5. Neon Auth 로그인 여부 확인
 * 6. 기존 Submitter 조회 또는 새로 생성
 *
 * @param documentBoxId 문서함 ID
 * @returns PublicSubmitAuthResult
 */
export async function validatePublicSubmitAuth(
  documentBoxId: string
): Promise<PublicSubmitAuthResult> {
  // 1. 문서함 조회 (필수서류, 폼 필드 포함)
  const documentBox = await prisma.documentBox.findUnique({
    where: { documentBoxId },
    include: {
      requiredDocuments: { orderBy: { order: 'asc' } },
      formFields: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!documentBox) {
    return { status: 'not_found' };
  }

  // 2. 문서함 상태 확인
  // - CLOSED, CLOSED_EXPIRED: 완전히 닫힘
  // - OPEN_SOMEONE: 공개 제출에서는 지원하지 않음 (지정 제출자 전용)
  // - OPEN, OPEN_RESUME: 제출 가능
  if (isDocumentBoxClosed(documentBox.status) || isDocumentBoxLimitedOpen(documentBox.status)) {
    return { status: 'closed', documentBox };
  }

  // 3. 공개 제출 문서함 여부 확인
  if (hasDesignatedSubmitters(documentBox.hasSubmitter)) {
    return { status: 'not_public', documentBox };
  }

  // 4. 만료 체크 (OPEN 상태일 때만, OPEN_RESUME는 이미 만료 후 상태)
  if (documentBox.status === 'OPEN' && new Date() > documentBox.endDate) {
    return { status: 'expired', documentBox };
  }

  // 5. 로고 URL 조회
  const logoUrl = await getLogoForDocumentBox(documentBoxId);

  // 5. Neon Auth 로그인 확인
  const { user } = await neonAuth();

  if (!user) {
    return {
      status: 'not_authenticated',
      documentBox: {
        ...documentBox,
        requiredDocuments: documentBox.requiredDocuments,
        logoUrl,
      },
    };
  }

  // 6. 기존 Submitter 조회 (userId로)
  let submitter = await prisma.submitter.findFirst({
    where: {
      documentBoxId,
      userId: user.id,
    },
    include: {
      submittedDocuments: true,
      formFieldResponses: true,
    },
  });

  // 7. Submitter가 없으면 새로 생성
  if (!submitter) {
    // User 테이블에서 프로필 정보 조회 (저장된 이름, 연락처 우선 사용)
    const userProfile = await prisma.user.findUnique({
      where: { authUserId: user.id },
      select: { name: true, phone: true },
    });

    submitter = await prisma.submitter.create({
      data: {
        name: userProfile?.name || user.name || user.email || '익명',
        email: user.email || '',
        phone: userProfile?.phone || '',
        documentBoxId,
        userId: user.id,
        status: 'PENDING',
      },
      include: {
        submittedDocuments: true,
        formFieldResponses: true,
      },
    });
  }

  // SubmitterWithDocumentBox 형태로 조합
  const submitterWithDocBox: SubmitterWithDocumentBox = {
    ...submitter,
    documentBox: {
      ...documentBox,
      requiredDocuments: documentBox.requiredDocuments,
      formFields: documentBox.formFields,
    },
    submittedDocuments: submitter.submittedDocuments,
    formFieldResponses: submitter.formFieldResponses,
  };

  return { status: 'success', user: user as NeonAuthUser, submitter: submitterWithDocBox, logoUrl };
}

/**
 * 공개 제출 문서함 정보 조회 (인증 없이)
 *
 * 랜딩 페이지에서 문서함 정보를 표시할 때 사용
 *
 * @param documentBoxId 문서함 ID
 * @returns DocumentBox 정보 또는 null
 */
export async function getPublicDocumentBox(
  documentBoxId: string
): Promise<DocumentBoxWithRequiredDocs | null> {
  const documentBox = await prisma.documentBox.findUnique({
    where: { documentBoxId },
    include: {
      requiredDocuments: { orderBy: { order: 'asc' } },
    },
  });

  if (!documentBox) {
    return null;
  }

  // 공개 제출 문서함이 아니면 null 반환
  if (hasDesignatedSubmitters(documentBox.hasSubmitter)) {
    return null;
  }

  return documentBox;
}
