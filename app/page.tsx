import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { getReturnUrlFromCookies } from "@/lib/auth/return-url";
import ReturnUrlHandler from "@/components/auth/ReturnUrlHandler";
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

  // 로그인된 상태이고 returnUrl 쿠키가 있으면 클라이언트에서 리다이렉트 처리
  // (쿠키 수정은 Server Action에서만 가능하므로 클라이언트 컴포넌트 사용)
  if (user && returnUrl) {
    return <ReturnUrlHandler returnUrl={returnUrl} />;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black selection:bg-primary/20">
      <Navbar />
      <Hero />
      <Problem />
      {/* <Solution /> */}
      <Audience />
      <Features />
      <UseCases />
      <CTA />
      <Footer />
    </main>
  );
}
