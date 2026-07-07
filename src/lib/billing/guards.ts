import type Stripe from "stripe";

import {
  FREE_TIER_COLLECTION_LIMIT,
  FREE_TIER_ITEM_LIMIT,
  isBillingInterval,
  isProItemType,
  type BillingInterval,
  PRO_ITEM_TYPES,
  PRO_PLAN_NAME,
  PRO_PRICE_AMOUNT_CENTS,
  PRO_PRICE_LABELS,
} from "@/lib/billing/config";

export {
  FREE_TIER_COLLECTION_LIMIT,
  FREE_TIER_ITEM_LIMIT,
  isBillingInterval,
  isProItemType,
  PRO_ITEM_TYPES,
  PRO_PLAN_NAME,
  PRO_PRICE_AMOUNT_CENTS,
  PRO_PRICE_LABELS,
};

export interface BillingState {
  id: string;
  email: string;
  name: string | null;
  isPro: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  itemCount: number;
  collectionCount: number;
}

export interface BillingGuardResult {
  allowed: boolean;
  message?: string;
}

const STRIPE_PRICE_ID_ENV_NAMES: Record<BillingInterval, string> = {
  monthly: "STRIPE_PRICE_ID_MONTHLY",
  yearly: "STRIPE_PRICE_ID_YEARLY",
};

export const STRIPE_PRICE_IDS: Record<BillingInterval, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  yearly: process.env.STRIPE_PRICE_ID_YEARLY,
};

export const getStripePriceId = (interval: BillingInterval) => {
  const priceId = STRIPE_PRICE_IDS[interval];

  if (!priceId) {
    throw new Error(`${STRIPE_PRICE_ID_ENV_NAMES[interval]} is not configured.`);
  }

  return priceId;
};

export const isActiveStripeSubscriptionStatus = (
  status: Stripe.Subscription.Status | null | undefined,
) => status === "active" || status === "trialing";

export const canCreateItemForPlan = ({
  isPro,
  itemCount,
  itemType,
}: {
  isPro: boolean;
  itemCount: number;
  itemType: string;
}): BillingGuardResult => {
  if (!isPro && isProItemType(itemType)) {
    return {
      allowed: false,
      message: "Upgrade to Pro to create file and image items.",
    };
  }

  if (!isPro && itemCount >= FREE_TIER_ITEM_LIMIT) {
    return {
      allowed: false,
      message: `Free plans are limited to ${FREE_TIER_ITEM_LIMIT} items. Upgrade to Pro to keep creating items.`,
    };
  }

  return { allowed: true };
};

export const canCreateCollectionForPlan = ({
  isPro,
  collectionCount,
}: {
  isPro: boolean;
  collectionCount: number;
}): BillingGuardResult => {
  if (!isPro && collectionCount >= FREE_TIER_COLLECTION_LIMIT) {
    return {
      allowed: false,
      message: `Free plans are limited to ${FREE_TIER_COLLECTION_LIMIT} collections. Upgrade to Pro to create more collections.`,
    };
  }

  return { allowed: true };
};

export const canUploadFilesForPlan = ({
  isPro,
  itemType,
}: {
  isPro: boolean;
  itemType: string;
}): BillingGuardResult => {
  if (!isPro && isProItemType(itemType)) {
    return {
      allowed: false,
      message: "Upgrade to Pro to upload files and images.",
    };
  }

  return { allowed: true };
};
