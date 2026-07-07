"use client";

import * as React from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface HomepagePricingProps {
  isSignedIn: boolean;
}

const freeFeatures = [
  { label: "50 items", disabled: false },
  { label: "3 collections", disabled: false },
  { label: "Snippets, Prompts, Commands, Notes, Links", disabled: false },
  { label: "Basic search", disabled: false },
  { label: "File & Image uploads", disabled: true },
  { label: "AI features", disabled: true },
] as const;

const proFeatures = [
  { label: "Unlimited items" },
  { label: "Unlimited collections" },
  { label: "All item types including Files & Images" },
  { label: "AI auto-tagging & summaries" },
  { label: 'AI "Explain This Code"' },
  { label: "Data export (JSON/ZIP)" },
] as const;

export function HomepagePricing({ isSignedIn }: HomepagePricingProps) {
  const [isYearly, setIsYearly] = React.useState(false);

  const primaryHref = isSignedIn ? "/upgrade" : "/register";
  const freeLabel = isSignedIn ? "View Plans" : "Get Started";
  const proLabel = isSignedIn ? "Upgrade to Pro" : "Start Free Trial";

  return (
    <>
      <div className="mb-8 flex items-center justify-center gap-4 md:mb-12">
        <span
          className={cn(
            "text-sm font-medium text-muted-foreground transition-colors",
            !isYearly && "text-foreground",
          )}
        >
          Monthly
        </span>
        <button
          type="button"
          className="relative h-7 w-12 cursor-pointer rounded-full border border-border bg-muted transition-colors"
          aria-label="Toggle billing period"
          onClick={() => setIsYearly((current) => !current)}
        >
          <span
            className={cn(
              "absolute top-0.75 left-0.75 size-5 rounded-full bg-muted-foreground transition",
              isYearly && "translate-x-5 bg-green-500",
            )}
          />
        </button>
        <span
          className={cn(
            "text-sm font-medium text-muted-foreground transition-colors",
            isYearly && "text-foreground",
          )}
        >
          Yearly{" "}
          <Badge className="ml-1 h-auto bg-linear-to-br from-green-500 to-green-700 px-2 py-0.5 text-[0.7rem] font-bold text-black">
            Save 25%
          </Badge>
        </span>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="relative min-h-130 border border-border bg-[#12121a] text-left transition hover:-translate-y-1 lg:min-h-140">
          <CardHeader className="mb-3 px-5 pt-7 md:px-8 md:pt-10">
            <CardTitle className="text-xl font-bold">Free</CardTitle>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold tracking-normal">$0</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <CardDescription>Perfect for getting started</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col px-5 pb-7 md:px-8 md:pb-10">
            <ul className="mb-8 flex list-none flex-col gap-3.5">
              {freeFeatures.map((feature) => (
                <li
                  key={feature.label}
                  className={cn(
                    "flex items-center gap-2.5 text-sm text-muted-foreground",
                    feature.disabled && "text-muted-foreground/50",
                  )}
                >
                  {feature.disabled ? <DisabledIcon /> : <CheckIcon />}
                  {feature.label}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-auto w-full">
              <Link href={primaryHref}>{freeLabel}</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="relative rounded-xl bg-linear-to-br from-blue-600 via-blue-500 to-blue-400 p-px transition hover:-translate-y-1">
          <Badge className="absolute -top-3 left-1/2 h-auto -translate-x-1/2 bg-linear-to-br from-blue-600 via-blue-500 to-blue-400 px-4 py-1 text-xs font-bold text-white">
            Most Popular
          </Badge>
          <Card className="min-h-130 border-0 bg-[#12121a] text-left lg:min-h-140">
          <CardHeader className="mb-3 px-5 pt-7 md:px-8 md:pt-10">
            <CardTitle className="text-xl font-bold">Pro</CardTitle>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold tracking-normal">
                {isYearly ? "$6" : "$8"}
              </span>
              <span className="text-sm text-muted-foreground">
                {isYearly ? "/month (billed $72/yr)" : "/month"}
              </span>
            </div>
            <CardDescription>For serious developers</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col px-5 pb-7 md:px-8 md:pb-10">
            <ul className="mb-8 flex list-none flex-col gap-3.5">
              {proFeatures.map((feature) => (
                <li
                  key={feature.label}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground"
                >
                  <CheckIcon />
                  {feature.label}
                </li>
              ))}
            </ul>
            <Button
              asChild
              className="mt-auto w-full bg-linear-to-br from-blue-600 via-blue-500 to-blue-400 text-white hover:opacity-90"
            >
              <Link href={primaryHref}>{proLabel}</Link>
            </Button>
          </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function CheckIcon() {
  return <Check className="size-4.5 shrink-0 text-green-500" strokeWidth={2.5} />;
}

function DisabledIcon() {
  return <X className="size-4.5 shrink-0 text-muted-foreground/50" />;
}
