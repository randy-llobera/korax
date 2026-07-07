import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  getBillingStateMock,
  getStripeMock,
  getStripePriceIdMock,
  updateStripeCustomerIdForUserMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getBillingStateMock: vi.fn(),
  getStripeMock: vi.fn(),
  getStripePriceIdMock: vi.fn(),
  updateStripeCustomerIdForUserMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/billing/guards", () => ({
  getStripePriceId: getStripePriceIdMock,
  isBillingInterval: (value: string) => value === "monthly" || value === "yearly",
}));

vi.mock("@/lib/db/billing", () => ({
  getBillingState: getBillingStateMock,
  updateStripeCustomerIdForUser: updateStripeCustomerIdForUserMock,
}));

vi.mock("@/lib/billing/stripe", () => ({
  getStripe: getStripeMock,
}));

import { POST } from "@/app/api/stripe/checkout/route";

describe("stripe checkout route POST", () => {
  beforeEach(() => {
    authMock.mockReset();
    getBillingStateMock.mockReset();
    getStripeMock.mockReset();
    getStripePriceIdMock.mockReset();
    updateStripeCustomerIdForUserMock.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "You must be signed in to start checkout.",
    });
  });

  it("rejects invalid billing intervals", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ interval: "weekly" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid billing interval." });
  });

  it("creates a Stripe customer when one does not exist", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    getBillingStateMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: "Test User",
      isPro: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      itemCount: 10,
      collectionCount: 1,
    });
    getStripePriceIdMock.mockReturnValue("price_monthly");
    const createCustomerMock = vi.fn().mockResolvedValue({ id: "cus_123" });
    const createCheckoutSessionMock = vi.fn().mockResolvedValue({
      url: "https://checkout.stripe.com/session",
    });
    getStripeMock.mockReturnValue({
      customers: {
        create: createCustomerMock,
      },
      checkout: {
        sessions: {
          create: createCheckoutSessionMock,
        },
      },
    });

    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ interval: "monthly" }),
      }),
    );

    expect(createCustomerMock).toHaveBeenCalledWith({
      email: "user@example.com",
      name: "Test User",
      metadata: {
        userId: "user-1",
      },
    });
    expect(updateStripeCustomerIdForUserMock).toHaveBeenCalledWith("user-1", "cus_123");
    expect(createCheckoutSessionMock).toHaveBeenCalledWith({
      mode: "subscription",
      customer: "cus_123",
      line_items: [
        {
          price: "price_monthly",
          quantity: 1,
        },
      ],
      success_url: "http://localhost/upgrade?billing=success",
      cancel_url: "http://localhost/upgrade?billing=cancelled",
      metadata: {
        userId: "user-1",
      },
      subscription_data: {
        metadata: {
          userId: "user-1",
        },
      },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://checkout.stripe.com/session",
    });
  });

  it("rejects checkout for active Pro users", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    getBillingStateMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: "Test User",
      isPro: true,
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      itemCount: 10,
      collectionCount: 1,
    });

    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ interval: "monthly" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "You already have an active Pro subscription.",
    });
  });
});
