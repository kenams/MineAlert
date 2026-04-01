import { CTA } from "@/components/landing/CTA";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/layout/Footer";

/**
 * Landing publique MineAlert.
 */
export default function Home(): JSX.Element {
  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      <Hero />
      <Features />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
