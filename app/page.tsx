import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getReturnUrlFromCookies,
  RETURN_URL_COOKIE,
} from "@/lib/auth/return-url";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import Solution from "@/components/landing/Solution";
import Features from "@/components/landing/Features";
import Audience from "@/components/landing/Audience";
import UseCases from "@/components/landing/UseCases";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/layout/Footer";

export default async function Home() {
  // OAuth 로그인 후 리다이렉트 처리
  const { user } = await getSession();
  const cookieStore = await cookies();
  const returnUrl = getReturnUrlFromCookies(cookieStore);

  // 로그인된 상태이고 returnUrl 쿠키가 있으면 해당 URL로 리다이렉트
  if (user && returnUrl) {
    // 쿠키 삭제 (서버 액션 사용)
    cookieStore.delete(RETURN_URL_COOKIE);
    redirect(returnUrl);
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black selection:bg-primary/20">
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <Features />
      <Audience />
      <UseCases />
      <CTA />
      <Footer />
    </main>
  );
}
