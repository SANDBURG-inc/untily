import { NextRequest, NextResponse } from "next/server";
import { neonAuthMiddleware } from "@neondatabase/neon-js/auth/next";

const allowedOrigins = [
  'http://localhost:3000',
  'https://www.untily.kr',
  'https://untily.kr',
  'https://dev.untily.kr',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /api/auth/* 경로: CORS 헤더 추가
  if (pathname.startsWith('/api/auth/')) {
    const origin = request.headers.get('origin');
    const isAllowedOrigin = origin && allowedOrigins.includes(origin);

    // Preflight 요청 처리
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      
      if (isAllowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Max-Age', '86400');
      }
      
      return response;
    }

    // 실제 요청 처리 - CORS 헤더 추가 및 헤더 보정
    const requestHeaders = new Headers(request.headers);
    if (process.env.NODE_ENV === 'production') {
      requestHeaders.set('x-forwarded-proto', 'https'); // 프로덕션 환경에서 HTTPS로 인식되도록 강제
    }

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  }

  // 대시보드 경로: callbackURL과 함께 /sign-in으로 리다이렉트
  if (pathname.startsWith("/dashboard")) {
    const dashboardAuthMiddleware = neonAuthMiddleware({
      loginUrl: `/sign-in?callbackURL=${encodeURIComponent(pathname)}`,
    });
    return dashboardAuthMiddleware(request);
  }

  // 제출자 경로: /upload, /complete 등 하위 페이지만 인증 필요
  // /submit/[documentBoxId]/[submitterId] 랜딩 페이지는 인증 불필요
  if (pathname.startsWith("/submit")) {
    // /submit/expired, /submit/not-found는 인증 불필요
    if (pathname === "/submit/expired" || pathname === "/submit/not-found") {
      return NextResponse.next();
    }

    // /submit/[documentBoxId]/[submitterId]/upload 또는 /complete 등 하위 경로
    // 패턴: /submit/xxx/xxx/yyy (4개 이상의 세그먼트)
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 4) {
      // submit 경로용 - 로그인 후 원래 페이지로 돌아옴
      const submitAuthMiddleware = neonAuthMiddleware({
        loginUrl: `/sign-in?callbackURL=${encodeURIComponent(pathname)}`,
      });
      return submitAuthMiddleware(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // CORS 처리가 필요한 API 경로
    "/api/auth/:path*",
    // 인증이 필요한 보호된 경로
    "/dashboard/:path*",
    "/submit/:path*",
  ],
};

