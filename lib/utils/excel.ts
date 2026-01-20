/**
 * Excel 파일 처리 유틸리티
 * SheetJS(xlsx) 라이브러리를 사용하여 제출자 데이터 가져오기/내보내기를 처리합니다.
 */
import * as XLSX from 'xlsx';
import type { Submitter } from '@/lib/types/document';
import { isValidPhoneNumber, formatPhoneNumber, extractDigits } from '@/lib/utils/phone';

// 양식 파일 컬럼 헤더
const TEMPLATE_HEADERS = ['이름', '이메일', '휴대전화'];

// 이메일 정규식
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Excel 파싱 에러 정보 */
export interface ExcelValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

/** Excel 파싱 결과 */
export interface ExcelParseResult {
  success: boolean;
  data: Submitter[];
  errors: ExcelValidationError[];
  totalRows: number;
  validRows: number;
  duplicateCount: number;
}

/**
 * 제출자 양식 파일 다운로드
 * 예시 데이터가 포함된 XLSX 파일을 생성하여 다운로드합니다.
 */
export function downloadSubmitterTemplate(): void {
  // 양식 데이터: 헤더 + 예시 1행
  const templateData = [
    TEMPLATE_HEADERS,
    ['홍길동', 'example@email.com', '010-1234-5678'],
  ];

  // 워크시트 생성
  const worksheet = XLSX.utils.aoa_to_sheet(templateData);

  // 열 너비 설정
  worksheet['!cols'] = [
    { wch: 15 }, // 이름
    { wch: 30 }, // 이메일
    { wch: 15 }, // 휴대전화
  ];

  // 워크북 생성
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '제출자');

  // 파일 다운로드
  XLSX.writeFile(workbook, '제출자_양식.xlsx');
}

/**
 * Excel 파일에서 제출자 데이터 파싱
 * @param file 업로드된 File 객체
 * @returns 파싱 결과 (성공/실패, 데이터, 에러 목록)
 */
export async function parseSubmittersFromExcel(file: File): Promise<ExcelParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // 첫 번째 시트 가져오기
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve({
            success: false,
            data: [],
            errors: [{ row: 0, field: '', value: '', message: '시트를 찾을 수 없습니다.' }],
            totalRows: 0,
            validRows: 0,
            duplicateCount: 0,
          });
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

        // 빈 파일 체크
        if (jsonData.length === 0 || (jsonData.length === 1 && (!jsonData[0] || jsonData[0].length === 0))) {
          resolve({
            success: false,
            data: [],
            errors: [{ row: 0, field: '', value: '', message: '데이터가 없습니다.' }],
            totalRows: 0,
            validRows: 0,
            duplicateCount: 0,
          });
          return;
        }

        // 헤더 검증 (첫 번째 행)
        const headers = jsonData[0] as string[];
        const headerValidation = validateHeaders(headers);
        if (!headerValidation.valid) {
          resolve({
            success: false,
            data: [],
            errors: [{ row: 1, field: 'header', value: '', message: headerValidation.message }],
            totalRows: 0,
            validRows: 0,
            duplicateCount: 0,
          });
          return;
        }

        // 데이터 행 파싱 (헤더 제외)
        const dataRows = jsonData.slice(1).filter(row => row && row.length > 0);
        const errors: ExcelValidationError[] = [];
        const validSubmitters: Submitter[] = [];
        const seenEmails = new Set<string>();
        let duplicateCount = 0;

        // 컬럼 인덱스 찾기
        const nameIdx = headers.findIndex(h => h === '이름');
        const emailIdx = headers.findIndex(h => h === '이메일');
        const phoneIdx = headers.findIndex(h => h === '휴대전화');

        dataRows.forEach((row, index) => {
          const rowNumber = index + 2; // 1-indexed, 헤더 제외
          const rowArray = row as string[];

          const name = String(rowArray[nameIdx] || '').trim();
          const email = String(rowArray[emailIdx] || '').trim().toLowerCase();
          const phone = String(rowArray[phoneIdx] || '').trim();

          // 이름 검증
          if (!name) {
            errors.push({ row: rowNumber, field: '이름', value: name, message: '이름을 입력해주세요.' });
          }

          // 이메일 검증
          if (!email) {
            errors.push({ row: rowNumber, field: '이메일', value: email, message: '이메일을 입력해주세요.' });
          } else if (!EMAIL_REGEX.test(email)) {
            errors.push({ row: rowNumber, field: '이메일', value: email, message: '올바른 이메일 형식이 아닙니다.' });
          }

          // 휴대전화 검증
          if (!phone) {
            errors.push({ row: rowNumber, field: '휴대전화', value: phone, message: '휴대전화를 입력해주세요.' });
          } else if (!isValidPhoneNumber(phone)) {
            errors.push({ row: rowNumber, field: '휴대전화', value: phone, message: '올바른 전화번호 형식이 아닙니다. (9~11자리)' });
          }

          // 이메일 중복 체크
          if (email && seenEmails.has(email)) {
            duplicateCount++;
            return; // 중복은 건너뜀
          }

          // 모든 검증 통과 시 추가
          if (name && email && EMAIL_REGEX.test(email) && phone && isValidPhoneNumber(phone)) {
            seenEmails.add(email);
            validSubmitters.push({
              id: `excel-${Date.now()}-${index}`,
              name,
              email,
              phone: formatPhoneNumber(extractDigits(phone)),
            });
          }
        });

        resolve({
          success: errors.length === 0,
          data: validSubmitters,
          errors,
          totalRows: dataRows.length,
          validRows: validSubmitters.length,
          duplicateCount,
        });
      } catch (error) {
        resolve({
          success: false,
          data: [],
          errors: [{ row: 0, field: '', value: '', message: '파일을 읽는 중 오류가 발생했습니다.' }],
          totalRows: 0,
          validRows: 0,
          duplicateCount: 0,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        errors: [{ row: 0, field: '', value: '', message: '파일을 읽는 중 오류가 발생했습니다.' }],
        totalRows: 0,
        validRows: 0,
        duplicateCount: 0,
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * 헤더 검증
 */
function validateHeaders(headers: string[]): { valid: boolean; message: string } {
  const normalizedHeaders = headers.map(h => (h || '').toString().trim());

  const missingHeaders = TEMPLATE_HEADERS.filter(
    required => !normalizedHeaders.includes(required)
  );

  if (missingHeaders.length > 0) {
    return {
      valid: false,
      message: `필수 컬럼이 없습니다: ${missingHeaders.join(', ')}. 양식을 다운로드해주세요.`,
    };
  }

  return { valid: true, message: '' };
}

/**
 * 기존 제출자 목록과 새 제출자 목록 병합
 * 이메일 기준으로 중복을 제거합니다.
 * @param existing 기존 제출자 목록
 * @param newSubmitters 새로 가져온 제출자 목록
 * @returns 병합된 제출자 목록과 중복 제거 수
 */
export function mergeSubmitters(
  existing: Submitter[],
  newSubmitters: Submitter[]
): { merged: Submitter[]; duplicateCount: number } {
  const existingEmails = new Set(existing.map(s => s.email.toLowerCase()));
  let duplicateCount = 0;

  const uniqueNew = newSubmitters.filter(s => {
    const emailLower = s.email.toLowerCase();
    if (existingEmails.has(emailLower)) {
      duplicateCount++;
      return false;
    }
    existingEmails.add(emailLower);
    return true;
  });

  return {
    merged: [...existing, ...uniqueNew],
    duplicateCount,
  };
}
