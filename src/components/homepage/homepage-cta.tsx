import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface HomepageCtaProps {
  isSignedIn: boolean;
}

export function HomepageCta({ isSignedIn }: HomepageCtaProps) {
  const primaryHref = isSignedIn ? "/dashboard" : "/register";
  const primaryLabel = isSignedIn ? "Open Dashboard" : "Get Started Free";
  const supportItems = ["Search everything fast", "Keep AI prompts reusable", "Store notes with code"];

  return (
    <section className="py-14 text-center md:py-18 lg:pt-22 lg:pb-18">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="mb-2 text-3xl leading-tight font-extrabold tracking-normal sm:text-4xl lg:mb-4 lg:text-[2.8rem]">
          Ready to Organize Your
          <br />
          <span className="bg-linear-to-br from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
            Developer Knowledge?
          </span>
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-[0.95rem] leading-7 text-muted-foreground md:text-[1.05rem]">
          Join thousands of developers who stopped losing their best work.
        </p>
        <div className="mx-auto mb-6 grid max-w-4xl grid-cols-1 gap-2.5 md:mb-8 lg:grid-cols-3 lg:gap-3">
          {supportItems.map((item) => (
            <Card
              key={item}
              className="rounded-lg border-border bg-foreground/3 px-4 py-3.5 text-sm font-semibold text-muted-foreground"
            >
              {item}
            </Card>
          ))}
        </div>
        <Button
          asChild
          size="lg"
          className="h-12 bg-linear-to-br from-blue-600 via-blue-500 to-blue-400 px-8 text-base text-white hover:opacity-90"
        >
          <Link href={primaryHref}>{primaryLabel}</Link>
        </Button>
      </div>
    </section>
  );
}
