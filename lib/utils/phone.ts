/**
 * 전화번호 포맷팅 유틸리티
 */

/**
 * 전화번호에서 숫자만 추출
 */
export function extractDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * 전화번호를 하이픈 형식으로 포맷팅 (010-1234-5678)
 * @param phone 전화번호 (숫자만 또는 하이픈 포함)
 * @returns 포맷팅된 전화번호
 */
export function formatPhoneNumber(phone: string): string {
  const digits = extractDigits(phone);

  // 11자리 휴대폰 번호 (010-XXXX-XXXX)
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  // 10자리 번호 (02-XXXX-XXXX 또는 031-XXX-XXXX)
  if (digits.length === 10) {
    // 서울 지역번호 (02)
    if (digits.startsWith('02')) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    // 그 외 지역번호
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // 9자리 (02-XXX-XXXX)
  if (digits.length === 9 && digits.startsWith('02')) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }

  // 그 외는 원본 반환
  return phone;
}

/**
 * 전화번호 유효성 검사
 */
export function isValidPhoneNumber(phone: string): boolean {
  const digits = extractDigits(phone);
  // 9~11자리 숫자
  return digits.length >= 9 && digits.length <= 11;
}
