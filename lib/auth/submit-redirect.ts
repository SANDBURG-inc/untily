/**
 * @fileoverview 제출 페이지 리다이렉트 헬퍼
 *
 * 공개 제출 / 지정 제출 페이지에서 반복되는 인증 상태별
 * 리다이렉트 로직을 추상화합니다.
 *
 * @module lib/auth/submit-redirect
 */
import 'server-only';

import { redirect } from 'next/navigation';
import type { PublicSubmitAuthResult } from './public-submit-auth';
import type { SubmitterAuthResult } from './submitter-auth';

/**
 * 공개 제출 인증 결과에 따른 리다이렉트 처리
 *
 * not_found, not_public, expired, not_authenticated 상태를 처리하고
 * success 상태만 반환합니다.
 *
 * @param result - validatePublicSubmitAuth 결과
 * @param documentBoxId - 문서함 ID
 * @returns success 상태의 result (타입 좁히기)
 *
 * @example
 * const result = await validatePublicSubmitAuth(documentBoxId);
 * const { submitter } = handlePublicAuthRedirects(result, documentBoxId);
 * // 이 시점에서 result.status는 'success'
 */
export function handlePublicAuthRedirects(
  result: PublicSubmitAuthResult,
  documentBoxId: string
): Extract<PublicSubmitAuthResult, { status: 'success' }> {
  if (result.status === 'not_found') {
    redirect('/submit/not-found');
  }

  if (result.status === 'not_public') {
    redirect('/submit/not-found');
  }

  if (result.status === 'expired') {
    redirect(`/submit/expired?title=${encodeURIComponent(result.documentBox.boxTitle)}`);
  }

  if (result.status === 'not_authenticated') {
    redirect(`/submit/${documentBoxId}`);
  }

  return result;
}

/**
 * 공개 제출 랜딩 페이지용 리다이렉트 처리
 *
 * 랜딩 페이지는 not_authenticated를 허용하므로 별도 함수로 분리
 * success인 경우 upload/complete로 리다이렉트됨
 *
 * @param result - validatePublicSubmitAuth 결과
 * @param documentBoxId - 문서함 ID
 * @returns not_authenticated 상태의 result (success는 리다이렉트됨)
 */
export function handlePublicLandingRedirects(
  result: PublicSubmitAuthResult,
  documentBoxId: string
): Extract<PublicSubmitAuthResult, { status: 'not_authenticated' }> {
  if (result.status === 'not_found') {
    redirect('/submit/not-found');
  }

  if (result.status === 'not_public') {
    redirect('/submit/not-found');
  }

  if (result.status === 'expired') {
    redirect(`/submit/expired?title=${encodeURIComponent(result.documentBox.boxTitle)}`);
  }

  // success인 경우 제출 완료 여부에 따라 리다이렉트
  if (result.status === 'success') {
    if (result.submitter.status === 'SUBMITTED') {
      redirect(`/submit/${documentBoxId}/complete`);
    }
    redirect(`/submit/${documentBoxId}/upload`);
  }

  return result;
}

/**
 * 지정 제출 인증 결과에 따른 리다이렉트 처리
 *
 * not_found, expired, not_authenticated, email_mismatch 상태를 처리하고
 * success 상태만 반환합니다.
 *
 * @param result - validateSubmitterAuth 결과
 * @param documentBoxId - 문서함 ID
 * @param submitterId - 제출자 ID
 * @returns success 상태의 result (타입 좁히기)
 *
 * @example
 * const result = await validateSubmitterAuth(documentBoxId, submitterId);
 * const { submitter } = handleSubmitterAuthRedirects(result, documentBoxId, submitterId);
 * // 이 시점에서 result.status는 'success'
 */
export function handleSubmitterAuthRedirects(
  result: SubmitterAuthResult,
  documentBoxId: string,
  submitterId: string
): Extract<SubmitterAuthResult, { status: 'success' }> {
  if (result.status === 'not_found') {
    redirect('/submit/not-found');
  }

  if (result.status === 'expired') {
    redirect(`/submit/expired?title=${encodeURIComponent(result.documentBox.boxTitle)}`);
  }

  if (result.status === 'not_authenticated') {
    redirect(`/submit/${documentBoxId}/${submitterId}`);
  }

  if (result.status === 'email_mismatch') {
    redirect(`/submit/${documentBoxId}/${submitterId}`);
  }

  return result;
}

/**
 * 지정 제출 랜딩 페이지용 리다이렉트 처리
 *
 * 랜딩 페이지는 not_authenticated, email_mismatch를 허용하므로 별도 함수로 분리
 * success인 경우 upload/complete로 리다이렉트됨
 *
 * @param result - validateSubmitterAuth 결과
 * @param documentBoxId - 문서함 ID
 * @param submitterId - 제출자 ID
 * @returns not_authenticated 또는 email_mismatch 상태의 result
 */
export function handleSubmitterLandingRedirects(
  result: SubmitterAuthResult,
  documentBoxId: string,
  submitterId: string
): Extract<SubmitterAuthResult, { status: 'not_authenticated' | 'email_mismatch' }> {
  if (result.status === 'not_found') {
    redirect('/submit/not-found');
  }

  if (result.status === 'expired') {
    redirect(`/submit/expired?title=${encodeURIComponent(result.documentBox.boxTitle)}`);
  }

  // success인 경우 제출 완료 여부에 따라 리다이렉트
  if (result.status === 'success') {
    if (result.submitter.status === 'SUBMITTED') {
      redirect(`/submit/${documentBoxId}/${submitterId}/complete`);
    }
    redirect(`/submit/${documentBoxId}/${submitterId}/upload`);
  }

  return result;
}
