/**
 * Neon Auth API 라우트 핸들러
 * 모든 인증 요청을 Neon Auth로 프록시합니다.
 * 
 * ⚠️ CORS 설정 (trustedOrigins)은 Neon Console에서 설정하세요:
 * 1. https://console.neon.tech 로그인
 * 2. 프로젝트 선택 → Auth 섹션
 * 3. Trusted Origins에 다음 추가:
 *    - http://localhost:3000
 *    - https://www.untily.kr
 *    - https://untily.kr
 *    - https://dev.untily.kr
 * 
 * @see https://neon.com/docs/auth/quick-start/nextjs
 */
import { authApiHandler } from '@neondatabase/neon-js/auth/next';

export const { GET, POST } = authApiHandler();