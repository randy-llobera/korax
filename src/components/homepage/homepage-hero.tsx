import Link from "next/link";

import { Button } from "@/components/ui/button";

import { HomepageChaosAnimation } from "./homepage-chaos-animation";

interface HomepageHeroProps {
  isSignedIn: boolean;
}

export function HomepageHero({ isSignedIn }: HomepageHeroProps) {
  const primaryHref = isSignedIn ? "/dashboard" : "/register";
  const primaryLabel = isSignedIn ? "Open Dashboard" : "Get Started Free";

  return (
    <section className="flex min-h-0 flex-col items-center justify-start px-4 pt-20 pb-7 text-center md:px-5 md:pt-21 md:pb-8 lg:min-h-screen lg:justify-center lg:px-6 lg:pt-30 lg:pb-20">
      <div className="mb-3 max-w-3xl md:mb-4 lg:mb-16">
        <h1 className="mb-3 text-[1.6rem] leading-tight font-extrabold tracking-normal sm:text-4xl md:mb-5 lg:text-[3.8rem]">
          Stop Losing Your
          <br />
          <span className="bg-linear-to-br from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
            Developer Knowledge
          </span>
        </h1>
        <p className="mx-auto mb-5 max-w-xl text-base leading-7 text-muted-foreground md:mb-8 md:text-[1.15rem]">
          A climbing harness carries the essentials so you can focus on the climb. Korax keeps your
          developer knowledge within reach.
        </p>
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 *:w-[min(100%,230px)] md:*:min-w-47.5 md:*:w-auto">
          <Button
            asChild
            size="lg"
            className="h-12 bg-linear-to-br from-blue-600 via-blue-500 to-blue-400 px-8 text-base text-white hover:opacity-90"
          >
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
            <a href="#features">See Features</a>
          </Button>
        </div>
      </div>

      <HomepageChaosAnimation />
    </section>
  );
}
