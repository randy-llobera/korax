import { HomepageAiSection } from "./homepage-ai-section";
import { HomepageCta } from "./homepage-cta";
import { HomepageFeatures } from "./homepage-features";
import { HomepageFooter } from "./homepage-footer";
import { HomepageHero } from "./homepage-hero";
import { HomepageNav } from "./homepage-nav";
import { HomepagePricing } from "./homepage-pricing";

interface HomepagePageProps {
  isSignedIn: boolean;
}

export function HomepagePage({ isSignedIn }: HomepagePageProps) {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0a0a0f] text-foreground before:pointer-events-none before:fixed before:inset-0 before:z-0 before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_28%)]">
      <div className="relative z-10">
        <HomepageNav isSignedIn={isSignedIn} />
        <HomepageHero isSignedIn={isSignedIn} />
        <HomepageFeatures />
        <HomepageAiSection />
        <section className="py-14 text-center md:py-18 lg:pt-22 lg:pb-28" id="pricing">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="mb-2 text-3xl leading-tight font-extrabold tracking-normal sm:text-4xl lg:mb-4 lg:text-[2.8rem]">
              Simple, Transparent
              <br />
              <span className="bg-linear-to-br from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
                Pricing
              </span>
            </h2>
            <p className="mx-auto mb-6 max-w-xl text-[0.95rem] leading-7 text-muted-foreground md:mb-10 md:text-[1.05rem]">
              Start free. Upgrade when you need more power.
            </p>
            <HomepagePricing isSignedIn={isSignedIn} />
          </div>
        </section>
        <HomepageCta isSignedIn={isSignedIn} />
        <HomepageFooter />
      </div>
    </main>
  );
}
