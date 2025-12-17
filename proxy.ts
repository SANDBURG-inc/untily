import { NextRequest, NextResponse } from "next/server";
import { neonAuthMiddleware } from "@neondatabase/neon-js/auth/next";

// neonAuthMiddleware 인스턴스 생성
const authMiddleware = neonAuthMiddleware({
  loginUrl: "/sign-in",
});

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 대시보드 경로: /sign-in으로 리다이렉트
  if (pathname.startsWith("/dashboard")) {
    return authMiddleware(request);
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
    // 인증이 필요한 보호된 경로
    "/dashboard/:path*",
    "/submit/:path*",
  ],
};
