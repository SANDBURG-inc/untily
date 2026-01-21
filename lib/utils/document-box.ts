/**
 * DocumentBox 관련 유틸리티 함수
 *
 * isSubmitter 플래그 관련 로직을 재사용 가능하게 추상화
 * [후방호환성] null은 true로 취급 (기존 데이터 호환)
 */

/**
 * 문서함이 지정 제출자를 가지는지 판별
 *
 * @param hasSubmitter - DocumentBox.hasSubmitter 값 (boolean | null)
 * @returns true: 지정 제출자 있음, false: 지정 제출자 없음
 *
 * @example
 * // 쿼리 결과에서 사용
 * const box = await prisma.documentBox.findUnique({ ... })
 * if (hasDesignatedSubmitters(box.hasSubmitter)) {
 *   // 제출자 목록 표시, 제출률 계산 등
 * }
 */
export function hasDesignatedSubmitters(hasSubmitter: boolean | null): boolean {
  // null인 경우 기존 데이터이므로 true로 취급 (후방호환성)
  return hasSubmitter ?? true;
}

/**
 * 제출 통계 계산 결과 타입
 */
export interface SubmissionStatistics {
  /** 전체 제출자 수 */
  totalSubmitters: number;
  /** 제출 완료 수 (모든 필수 서류 제출) */
  submittedCount: number;
  /** 미제출 수 */
  notSubmittedCount: number;
  /** 진행률 (0-100) */
  submissionRate: number;
  /** 지정 제출자 여부 */
  hasDesignatedSubmitters: boolean;
}

/**
 * 제출자 정보로 통계 데이터 계산
 *
 * @param submitters - 제출자 목록 (status 포함)
 * @param totalRequiredDocuments - 필수 서류 총 개수 (미사용, 호환성 유지)
 * @param hasSubmitter - 지정 제출자 여부 플래그
 * @returns 계산된 통계 데이터
 *
 * @example
 * const stats = calculateSubmissionStats(
 *   documentBox.submitters,
 *   documentBox.totalRequiredDocuments,
 *   documentBox.hasSubmitter
 * )
 */
export function calculateSubmissionStats(
  submitters: Array<{ status: string }>,
  totalRequiredDocuments: number,
  hasSubmitter: boolean | null
): SubmissionStatistics {
  const hasSubmitters = hasDesignatedSubmitters(hasSubmitter);
  const totalSubmitters = submitters.length;

  // 제출 완료: status가 SUBMITTED인 제출자만
  const submittedCount = submitters.filter(
    (s) => s.status === 'SUBMITTED'
  ).length;

  // 미제출: PENDING 또는 REJECTED (제출완료가 아닌 모든 상태)
  const notSubmittedCount = totalSubmitters - submittedCount;

  // 진행률: 제출 완료 / 전체 (퍼센트)
  const submissionRate =
    totalSubmitters > 0
      ? Math.round((submittedCount / totalSubmitters) * 100)
      : 0;

  return {
    totalSubmitters,
    submittedCount,
    notSubmittedCount,
    submissionRate,
    hasDesignatedSubmitters: hasSubmitters,
  };
}
