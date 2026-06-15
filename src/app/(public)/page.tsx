import dynamic from "next/dynamic";
import { Features } from "@/components/landing/sections/features";
import { FloatingBackground } from "@/components/landing/sections/floating-background";
import { Footer } from "@/components/landing/sections/footer";
import { Hero } from "@/components/landing/sections/hero";
import { Navbar } from "@/components/landing/sections/navbar";

const FloatingEmojis = dynamic(
  () =>
    import("@/components/landing/sections/floating-emojis").then(
      (m) => m.FloatingEmojis,
    ),
  { ssr: true },
);

const ScrollProgress = dynamic(
  () =>
    import("@/components/landing/sections/scroll-progress").then(
      (m) => m.ScrollProgress,
    ),
  { ssr: true },
);

const BackToTop = dynamic(
  () =>
    import("@/components/landing/sections/back-to-top").then(
      (m) => m.BackToTop,
    ),
  { ssr: true },
);

const Courses = dynamic(
  () => import("@/components/landing/sections/courses").then((m) => m.Courses),
  { ssr: true },
);

const HowItWorks = dynamic(
  () =>
    import("@/components/landing/sections/how-it-works").then(
      (m) => m.HowItWorks,
    ),
  { ssr: true },
);

const ProgressDemo = dynamic(
  () =>
    import("@/components/landing/sections/progress-demo").then(
      (m) => m.ProgressDemo,
    ),
  { ssr: true },
);

const Testimonials = dynamic(
  () =>
    import("@/components/landing/sections/testimonials").then(
      (m) => m.Testimonials,
    ),
  { ssr: true },
);

const CTASection = dynamic(
  () =>
    import("@/components/landing/sections/cta-section").then(
      (m) => m.CTASection,
    ),
  { ssr: true },
);

export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <div className="relative" style={{ background: "var(--hero-bg)" }}>
        <FloatingBackground />
        <FloatingEmojis />
        <Navbar />
        <main className="relative">
          <Hero />
        </main>
        <div className="bg-background">
          <Features />
          <Courses />
          <HowItWorks />
          <ProgressDemo />
          <Testimonials />
          <CTASection />
          <Footer />
        </div>
      </div>
      <BackToTop />
    </>
  );
}
