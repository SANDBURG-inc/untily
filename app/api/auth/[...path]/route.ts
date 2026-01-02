/**
 * Neon Auth API 라우트 핸들러
 * 모든 인증 요청을 Neon Auth로 프록시합니다.
 * @see https://neon.com/docs/auth/quick-start/nextjs
 */
import { authApiHandler } from '@neondatabase/neon-js/auth/next';

export const { GET, POST } = authApiHandler();
