"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CreditCard, ExternalLink, LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  BILLING_STATUS_MESSAGES,
  PRO_PLAN_NAME,
  PRO_PRICE_LABELS,
  type BillingInterval,
} from "@/lib/billing/config";
import { redirectToBillingUrl } from "@/lib/billing/client";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UpgradePageProps {
  isPro: boolean;
  stripeCustomerId: string | null;
  showHeader?: boolean;
}

const freeFeatures = [
  "50 items",
  "3 collections",
  "Snippets, Prompts, Commands, Notes, Links",
  "Basic search",
];

const proFeatures = [
  "Unlimited items",
  "Unlimited collections",
  "All item types including Files and Images",
  "AI auto-tagging and summaries",
  'AI "Explain This Code"',
  "Data export (JSON/ZIP)",
];

export const UpgradePage = ({
  isPro,
  stripeCustomerId,
  showHeader = true,
}: UpgradePageProps) => {
  const searchParams = useSearchParams();
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>("monthly");
  const [pendingInterval, setPendingInterval] = useState<BillingInterval | null>(null);
  const [isOpeningPortal, startPortalTransition] = useTransition();

  const statusMessage = useMemo(() => {
    const billingState = searchParams.get("billing");

    return billingState ? BILLING_STATUS_MESSAGES[billingState] ?? null : null;
  }, [searchParams]);

  const handleCheckout = (interval: BillingInterval) => {
    setPendingInterval(interval);

    void redirectToBillingUrl("/api/stripe/checkout", { interval })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to start checkout.");
      })
      .finally(() => {
        setPendingInterval(null);
      });
  };

  const handlePortal = () => {
    startPortalTransition(async () => {
      try {
        await redirectToBillingUrl("/api/stripe/portal");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to open billing portal.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {showHeader ? (
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Upgrade</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Compare Free and Pro, choose monthly or yearly billing, then continue to Stripe checkout.
          </p>
        </div>
      ) : null}

      {statusMessage ? (
        <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {statusMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={selectedInterval === "monthly" ? "default" : "outline"}
          onClick={() => setSelectedInterval("monthly")}
        >
          Monthly
          <span className="text-xs text-current/80">{PRO_PRICE_LABELS.monthly}</span>
        </Button>
        <Button
          type="button"
          variant={selectedInterval === "yearly" ? "default" : "outline"}
          onClick={() => setSelectedInterval("yearly")}
        >
          Yearly
          <span className="text-xs text-current/80">{PRO_PRICE_LABELS.yearly}</span>
        </Button>
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
          Save 25% with yearly billing
        </Badge>
      </div>

      {isPro ? (
        <Card className="border-border/70">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full px-3 py-1">{PRO_PLAN_NAME} active</Badge>
            </div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4 text-muted-foreground" />
              Your account already has Pro access
            </CardTitle>
            <CardDescription>
              You can manage your subscription from billing settings or the Stripe portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handlePortal}
              disabled={isOpeningPortal || !stripeCustomerId}
            >
              {isOpeningPortal ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <ExternalLink className="size-4" />
              )}
              Manage billing
            </Button>
            <Button asChild variant="ghost">
              <Link href="/settings">Open settings</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Free</CardTitle>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Current plan
              </Badge>
            </div>
            <CardDescription>Perfect for getting started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-semibold tracking-tight">
              $0
              <span className="ml-1 text-sm font-normal text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
              <li className="flex items-start gap-3 text-muted-foreground/70">
                <Sparkles className="mt-0.5 size-4" />
                <span>Files, Images, and AI features require Pro.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "border-border/70",
            !isPro && "border-primary/40 bg-primary/3",
          )}
        >
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Pro</CardTitle>
              <Badge className="rounded-full px-3 py-1">Most popular</Badge>
            </div>
            <CardDescription>For serious developers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-semibold tracking-tight">
              {selectedInterval === "monthly" ? "$8" : "$72"}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                {selectedInterval === "monthly" ? "/month" : "/year"}
              </span>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {!isPro ? (
              <Button
                type="button"
                className="w-full"
                onClick={() => handleCheckout(selectedInterval)}
                disabled={pendingInterval !== null}
              >
                {pendingInterval === selectedInterval ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                Upgrade {selectedInterval === "monthly" ? "monthly" : "yearly"}
              </Button>
            ) : (
              <Button asChild variant="ghost" className="w-full">
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
