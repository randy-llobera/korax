import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getBillingState } from "@/lib/db/billing";
import { getStripe } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be signed in to manage billing." },
      { status: 401 },
    );
  }

  const billingState = await getBillingState(session.user.id);

  if (!billingState) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (!billingState.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer was found for this account." },
      { status: 400 },
    );
  }

  try {
    const origin = new URL(request.url).origin;
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: billingState.stripeCustomerId,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Failed to create Stripe billing portal session.", error);

    return NextResponse.json({ error: "Unable to open billing portal." }, { status: 500 });
  }
};
