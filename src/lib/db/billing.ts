import type Stripe from "stripe";

import { isActiveStripeSubscriptionStatus, type BillingState } from "@/lib/billing/guards";
import { prisma } from "@/lib/prisma";

export const getBillingState = async (userId: string): Promise<BillingState | null> => {
  const [user, itemCount, collectionCount] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isPro: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    }),
    prisma.item.count({
      where: {
        userId,
      },
    }),
    prisma.collection.count({
      where: {
        userId,
      },
    }),
  ]);

  if (!user) {
    return null;
  }

  return {
    ...user,
    itemCount,
    collectionCount,
  };
};

export const updateStripeCustomerIdForUser = async (
  userId: string,
  stripeCustomerId: string,
) =>
  prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      stripeCustomerId,
    },
    select: {
      id: true,
      stripeCustomerId: true,
    },
  });

const getSubscriptionId = (subscription: string | Stripe.Subscription | null) => {
  if (!subscription) {
    return null;
  }

  return typeof subscription === "string" ? subscription : subscription.id;
};

export const syncUserBillingFromCheckoutSession = async (
  session: Stripe.Checkout.Session,
) => {
  const userId = session.metadata?.userId;
  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const stripeSubscriptionId = getSubscriptionId(session.subscription ?? null);

  if (!userId) {
    return null;
  }

  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      isPro: true,
      stripeCustomerId,
      stripeSubscriptionId,
    },
    select: {
      id: true,
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });
};

const getSubscriptionUserWhere = (subscription: Stripe.Subscription) => {
  const userId = subscription.metadata.userId;
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  if (userId) {
    return {
      id: userId,
    };
  }

  if (stripeCustomerId) {
    return {
      stripeCustomerId,
    };
  }

  return subscription.id
    ? {
        stripeSubscriptionId: subscription.id,
      }
    : null;
};

export const syncUserBillingFromSubscription = async (
  subscription: Stripe.Subscription,
) => {
  const where = getSubscriptionUserWhere(subscription);

  if (!where) {
    return null;
  }

  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  return prisma.user.update({
    where,
    data: {
      isPro: isActiveStripeSubscriptionStatus(subscription.status),
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
    },
    select: {
      id: true,
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });
};
