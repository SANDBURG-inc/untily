import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import Solution from "@/components/landing/Solution";
import Features from "@/components/landing/Features";
import Audience from "@/components/landing/Audience";
import UseCases from "@/components/landing/UseCases";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/layout/Footer";

export default function Home() {
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
