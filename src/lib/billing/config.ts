import { FILE_ITEM_TYPES } from "@/lib/items/form";

export const PRO_PLAN_NAME = "Pro";
export const BILLING_INTERVALS = ["monthly", "yearly"] as const;
export const FREE_TIER_ITEM_LIMIT = 50;
export const FREE_TIER_COLLECTION_LIMIT = 3;
export const PRO_ITEM_TYPES = FILE_ITEM_TYPES;
export const BILLING_STATUS_MESSAGES: Record<string, string> = {
  cancelled: "Checkout was cancelled. Your plan has not changed.",
  success: "Checkout completed. Refresh this page in a moment if your Pro access has not updated yet.",
  upgrade: "Upgrade to Pro to unlock file uploads, image uploads, and higher usage limits.",
};

export type BillingInterval = (typeof BILLING_INTERVALS)[number];
export type ProItemType = (typeof PRO_ITEM_TYPES)[number];

export const PRO_PRICE_AMOUNT_CENTS: Record<BillingInterval, number> = {
  monthly: 800,
  yearly: 7200,
};

export const PRO_PRICE_LABELS: Record<BillingInterval, string> = {
  monthly: "$8/month",
  yearly: "$72/year",
};

export const isBillingInterval = (value: string): value is BillingInterval =>
  BILLING_INTERVALS.includes(value as BillingInterval);

export const isProItemType = (value: string): value is ProItemType =>
  PRO_ITEM_TYPES.includes(value as ProItemType);
