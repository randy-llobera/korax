import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { syncUserBillingFromCheckoutSession, syncUserBillingFromSubscription } from "@/lib/db/billing";
import { getStripe, getStripeWebhookSecret } from "@/lib/billing/stripe";

export const runtime = "nodejs";

const handleStripeEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed":
      await syncUserBillingFromCheckoutSession(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncUserBillingFromSubscription(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }
};

export const POST = async (request: Request) => {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (error) {
    console.error("Failed to verify Stripe webhook.", error);

    return NextResponse.json({ error: "Invalid Stripe webhook." }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Failed to sync Stripe webhook state.", error);

    return NextResponse.json({ error: "Unable to process Stripe webhook." }, { status: 500 });
  }
};
