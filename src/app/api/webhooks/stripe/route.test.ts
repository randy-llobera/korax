import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getStripeMock,
  getStripeWebhookSecretMock,
  syncUserBillingFromCheckoutSessionMock,
  syncUserBillingFromSubscriptionMock,
} = vi.hoisted(() => ({
  getStripeMock: vi.fn(),
  getStripeWebhookSecretMock: vi.fn(),
  syncUserBillingFromCheckoutSessionMock: vi.fn(),
  syncUserBillingFromSubscriptionMock: vi.fn(),
}));

vi.mock("@/lib/db/billing", () => ({
  syncUserBillingFromCheckoutSession: syncUserBillingFromCheckoutSessionMock,
  syncUserBillingFromSubscription: syncUserBillingFromSubscriptionMock,
}));

vi.mock("@/lib/billing/stripe", () => ({
  getStripe: getStripeMock,
  getStripeWebhookSecret: getStripeWebhookSecretMock,
}));

import { POST } from "@/app/api/webhooks/stripe/route";

describe("stripe webhook route POST", () => {
  beforeEach(() => {
    getStripeMock.mockReset();
    getStripeWebhookSecretMock.mockReset();
    syncUserBillingFromCheckoutSessionMock.mockReset();
    syncUserBillingFromSubscriptionMock.mockReset();
  });

  it("rejects requests without a Stripe signature", async () => {
    const response = await POST(
      new Request("http://localhost/api/webhooks/stripe", { method: "POST", body: "{}" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing Stripe signature.",
    });
  });

  it("syncs checkout completion events", async () => {
    const constructEventMock = vi.fn().mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_123",
          metadata: { userId: "user-1" },
          customer: "cus_123",
          subscription: "sub_123",
        },
      },
    });
    getStripeMock.mockReturnValue({
      webhooks: {
        constructEvent: constructEventMock,
      },
    });
    getStripeWebhookSecretMock.mockReturnValue("whsec_123");

    const response = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        headers: {
          "stripe-signature": "signature",
        },
        body: JSON.stringify({ id: "evt_123" }),
      }),
    );

    expect(constructEventMock).toHaveBeenCalledWith(
      JSON.stringify({ id: "evt_123" }),
      "signature",
      "whsec_123",
    );
    expect(syncUserBillingFromCheckoutSessionMock).toHaveBeenCalledWith({
      id: "cs_123",
      metadata: { userId: "user-1" },
      customer: "cus_123",
      subscription: "sub_123",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
  });

  it("syncs subscription lifecycle events", async () => {
    const subscription = {
      id: "sub_123",
      status: "active",
      customer: "cus_123",
      metadata: { userId: "user-1" },
    };
    getStripeMock.mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockReturnValue({
          type: "customer.subscription.updated",
          data: {
            object: subscription,
          },
        }),
      },
    });
    getStripeWebhookSecretMock.mockReturnValue("whsec_123");

    const response = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        headers: {
          "stripe-signature": "signature",
        },
        body: JSON.stringify({ id: "evt_456" }),
      }),
    );

    expect(syncUserBillingFromSubscriptionMock).toHaveBeenCalledWith(subscription);
    expect(response.status).toBe(200);
  });

  it("returns a 400 for invalid Stripe payloads", async () => {
    getStripeMock.mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => {
          throw new Error("Invalid signature");
        }),
      },
    });
    getStripeWebhookSecretMock.mockReturnValue("whsec_123");

    const response = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        headers: {
          "stripe-signature": "bad-signature",
        },
        body: "{}",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid Stripe webhook.",
    });
  });

  it("returns a 500 when webhook sync fails after verification", async () => {
    getStripeMock.mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockReturnValue({
          type: "customer.subscription.updated",
          data: {
            object: {
              id: "sub_123",
              status: "active",
              customer: "cus_123",
              metadata: { userId: "user-1" },
            },
          },
        }),
      },
    });
    getStripeWebhookSecretMock.mockReturnValue("whsec_123");
    syncUserBillingFromSubscriptionMock.mockRejectedValue(new Error("db failure"));

    const response = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        headers: {
          "stripe-signature": "signature",
        },
        body: "{}",
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Unable to process Stripe webhook.",
    });
  });
});
