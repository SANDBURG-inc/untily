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

/**
 * 전화번호 입력 중 실시간 하이픈 포맷팅
 * 사용자가 타이핑하는 동안 자동으로 하이픈을 추가합니다.
 *
 * 지원 형식:
 * - 휴대폰 (010, 011, 016, 017, 018, 019): 010-XXXX-XXXX
 * - 서울 지역번호 (02): 02-XXXX-XXXX
 * - 기타 지역번호 (031, 051 등): 031-XXX-XXXX 또는 031-XXXX-XXXX
 * - 국제전화 (+82 등): +82-10-XXXX-XXXX
 *
 * @param value 입력된 전화번호
 * @returns 하이픈이 추가된 전화번호
 */
export function formatPhoneNumberOnInput(value: string): string {
  // 국제전화 (+로 시작)
  if (value.startsWith('+')) {
    const numbers = value.slice(1).replace(/[^0-9]/g, '');

    // 1자리 국가코드: +1 (북미), +7 (러시아/카자흐스탄)
    if (numbers.startsWith('1') || numbers.startsWith('7')) {
      const cc = numbers.slice(0, 1);
      const rest = numbers.slice(1);
      // +1-XXX-XXX-XXXX (북미 형식 3-3-4)
      if (rest.length <= 3) {
        return `+${cc}${rest ? '-' + rest : ''}`;
      } else if (rest.length <= 6) {
        return `+${cc}-${rest.slice(0, 3)}-${rest.slice(3)}`;
      } else {
        return `+${cc}-${rest.slice(0, 3)}-${rest.slice(3, 6)}-${rest.slice(6, 10)}`;
      }
    }

    // 한국 (+82) - 국내 형식 적용
    if (numbers.startsWith('82')) {
      const rest = numbers.slice(2);
      // 서울 (2로 시작)
      if (rest.startsWith('2')) {
        if (rest.length <= 1) {
          return `+82-${rest}`;
        } else if (rest.length <= 4) {
          return `+82-2-${rest.slice(1)}`;
        } else if (rest.length <= 8) {
          return `+82-2-${rest.slice(1, 4)}-${rest.slice(4)}`;
        } else {
          return `+82-2-${rest.slice(1, 5)}-${rest.slice(5, 9)}`;
        }
      }
      // 휴대폰/지역번호 (10, 31, 51 등)
      if (rest.length <= 2) {
        return `+82${rest ? '-' + rest : ''}`;
      } else if (rest.length <= 6) {
        return `+82-${rest.slice(0, 2)}-${rest.slice(2)}`;
      } else {
        return `+82-${rest.slice(0, 2)}-${rest.slice(2, 6)}-${rest.slice(6, 10)}`;
      }
    }

    // 3자리 국가코드 (3XX, 8XX 일부 - 홍콩 852, 아일랜드 353 등)
    const threeDigitCodes = ['352', '353', '354', '355', '356', '357', '358', '359', '370', '371', '372', '373', '374', '375', '376', '377', '378', '380', '381', '382', '383', '385', '386', '387', '389', '420', '421', '423', '500', '501', '502', '503', '504', '505', '506', '507', '508', '509', '590', '591', '592', '593', '594', '595', '596', '597', '598', '599', '670', '672', '673', '674', '675', '676', '677', '678', '679', '680', '681', '682', '683', '685', '686', '687', '688', '689', '690', '691', '692', '850', '852', '853', '855', '856', '880', '886', '960', '961', '962', '963', '964', '965', '966', '967', '968', '970', '971', '972', '973', '974', '975', '976', '977', '992', '993', '994', '995', '996', '998'];
    const potentialCC = numbers.slice(0, 3);
    if (threeDigitCodes.includes(potentialCC)) {
      const cc = potentialCC;
      const rest = numbers.slice(3);
      if (rest.length <= 4) {
        return `+${cc}${rest ? '-' + rest : ''}`;
      } else if (rest.length <= 8) {
        return `+${cc}-${rest.slice(0, 4)}-${rest.slice(4)}`;
      } else {
        return `+${cc}-${rest.slice(0, 4)}-${rest.slice(4, 8)}-${rest.slice(8, 12)}`;
      }
    }

    // 2자리 국가코드 (기본값)
    const cc = numbers.slice(0, 2);
    const rest = numbers.slice(2);
    if (numbers.length <= 2) {
      return `+${numbers}`;
    } else if (rest.length <= 4) {
      return `+${cc}-${rest}`;
    } else if (rest.length <= 8) {
      return `+${cc}-${rest.slice(0, 4)}-${rest.slice(4)}`;
    } else {
      return `+${cc}-${rest.slice(0, 4)}-${rest.slice(4, 8)}-${rest.slice(8, 12)}`;
    }
  }

  const numbers = value.replace(/[^0-9]/g, '');

  // 서울 지역번호 (02): 9자리(2-3-4) 또는 10자리(2-4-4)
  if (numbers.startsWith('02')) {
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
    } else {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    }
  }

  // 휴대폰 번호 (010, 011, 016, 017, 018, 019)
  const mobilePrefix = ['010', '011', '016', '017', '018', '019'];
  if (mobilePrefix.some((prefix) => numbers.startsWith(prefix))) {
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  }

  // 기타 지역번호 (031, 032, 033, 041, 042, 043, 044, 051, 052, 053, 054, 055, 061, 062, 063, 064, 070 등)
  // 3-3-4 형식 적용 (10자리), 11자리면 3-4-4
  if (numbers.startsWith('0')) {
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  }

  // 그 외는 원본 반환
  return value;
}
