import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  getStripePriceId,
  isBillingInterval,
} from "@/lib/billing/guards";
import { getBillingState, updateStripeCustomerIdForUser } from "@/lib/db/billing";
import { getStripe } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be signed in to start checkout." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as { interval?: string } | null;
  const interval = body?.interval;

  if (!interval || !isBillingInterval(interval)) {
    return NextResponse.json({ error: "Invalid billing interval." }, { status: 400 });
  }

  const billingState = await getBillingState(session.user.id);

  if (!billingState) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (billingState.isPro) {
    return NextResponse.json(
      { error: "You already have an active Pro subscription." },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    let stripeCustomerId = billingState.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: billingState.email,
        name: billingState.name ?? undefined,
        metadata: {
          userId: billingState.id,
        },
      });

      stripeCustomerId = customer.id;
      await updateStripeCustomerIdForUser(billingState.id, customer.id);
    }

    const origin = new URL(request.url).origin;
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: getStripePriceId(interval),
          quantity: 1,
        },
      ],
      success_url: `${origin}/upgrade?billing=success`,
      cancel_url: `${origin}/upgrade?billing=cancelled`,
      metadata: {
        userId: billingState.id,
      },
      subscription_data: {
        metadata: {
          userId: billingState.id,
        },
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Failed to create Stripe checkout session.", error);

    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
};
