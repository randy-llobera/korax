"use client";

import Link from "next/link";
import { useMemo, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, ExternalLink, LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
  BILLING_STATUS_MESSAGES,
  FREE_TIER_COLLECTION_LIMIT,
  FREE_TIER_ITEM_LIMIT,
  PRO_PLAN_NAME,
} from "@/lib/billing/config";
import { redirectToBillingUrl } from "@/lib/billing/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BillingSettingsProps {
  collectionCount: number;
  isPro: boolean;
  itemCount: number;
  stripeCustomerId: string | null;
}

const getCurrentAccessCopy = (isPro: boolean) =>
  isPro
    ? "Your account can create all item types and use the billing portal."
    : "Free accounts can create text and link items, with capped item and collection counts.";

interface UsageLimitCardProps {
  count: number;
  isPro: boolean;
  label: string;
  limit: number;
}

const UsageLimitCard = ({ count, isPro, label, limit }: UsageLimitCardProps) => (
  <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
    <div className="text-sm font-medium">{label}</div>
    <div className="mt-1 text-sm text-muted-foreground">
      {count}
      {isPro ? " total" : ` / ${limit} free`}
    </div>
  </div>
);

export const BillingSettings = ({
  collectionCount,
  isPro,
  itemCount,
  stripeCustomerId,
}: BillingSettingsProps) => {
  const searchParams = useSearchParams();
  const [isOpeningPortal, startPortalTransition] = useTransition();
  const statusMessage = useMemo(() => {
    const billingState = searchParams.get("billing");

    return billingState ? BILLING_STATUS_MESSAGES[billingState] ?? null : null;
  }, [searchParams]);

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
    <Card className="border-border/70">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4 text-muted-foreground" />
              Billing
            </CardTitle>
            <CardDescription>
              Manage your plan and the limits that gate item creation, collections, and uploads.
            </CardDescription>
          </div>
          <Badge variant={isPro ? "default" : "outline"} className="w-fit rounded-full px-3 py-1">
            {isPro ? `${PRO_PLAN_NAME} active` : "Free plan"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {statusMessage ? (
          <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {statusMessage}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4 text-muted-foreground" />
                Current access
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {getCurrentAccessCopy(isPro)}
              </p>
            </div>

            {isPro ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePortal}
                disabled={isOpeningPortal || !stripeCustomerId}
              >
                {isOpeningPortal ? <LoaderCircle className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
                Manage billing
              </Button>
            ) : (
              <Button asChild>
                <Link href="/upgrade">View upgrade options</Link>
              </Button>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
            <div>
              <p className="text-sm font-medium">Usage summary</p>
              <p className="text-sm text-muted-foreground">
                Server-side gating uses these counts even if a UI control is hidden.
              </p>
            </div>
            <div className="space-y-3">
              <UsageLimitCard
                count={itemCount}
                isPro={isPro}
                label="Items"
                limit={FREE_TIER_ITEM_LIMIT}
              />
              <UsageLimitCard
                count={collectionCount}
                isPro={isPro}
                label="Collections"
                limit={FREE_TIER_COLLECTION_LIMIT}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
