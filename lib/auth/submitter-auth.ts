import "server-only";

import { stackServerApp } from '@/stack/server';
import prisma from '@/lib/db';
import type { DocumentBox, RequiredDocument, Submitter, SubmitterStatus, SubmittedDocument } from '@/lib/generated/prisma/client';

/**
 * 제출자 인증 결과 타입
 */
export type SubmitterAuthResult =
  | { status: 'success'; user: NonNullable<Awaited<ReturnType<typeof stackServerApp.getUser>>>; submitter: SubmitterWithDocumentBox }
  | { status: 'not_authenticated'; submitter: SubmitterWithDocumentBox }
  | { status: 'email_mismatch'; user: NonNullable<Awaited<ReturnType<typeof stackServerApp.getUser>>>; submitter: SubmitterWithDocumentBox }
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
 * 4. Stack Auth 로그인 여부 확인
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

  // 4. Stack Auth 로그인 확인
  const user = await stackServerApp.getUser();

  if (!user) {
    return { status: 'not_authenticated', submitter: submitterWithDocBox };
  }

  // 5. 이메일 일치 확인 (대소문자 무시)
  const userEmail = user.primaryEmail?.toLowerCase();
  const submitterEmail = submitter.email.toLowerCase();

  if (userEmail !== submitterEmail) {
    return { status: 'email_mismatch', user, submitter: submitterWithDocBox };
  }

  // 6. userId 연결 (최초 로그인 시)
  if (!submitter.userId) {
    await prisma.submitter.update({
      where: { submitterId },
      data: { userId: user.id },
    });
    // 업데이트된 정보 반영
    submitterWithDocBox.userId = user.id;
  }

  return { status: 'success', user, submitter: submitterWithDocBox };
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
