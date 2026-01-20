/**
 * 날짜를 한국어 형식으로 포맷팅
 * @example formatDateKorean(new Date()) // "2025년 1월 15일"
 */
export function formatDateKorean(date: Date): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
