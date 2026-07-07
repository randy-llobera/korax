import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, getBillingStateMock, getStripeMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getBillingStateMock: vi.fn(),
  getStripeMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/billing", () => ({
  getBillingState: getBillingStateMock,
}));

vi.mock("@/lib/billing/stripe", () => ({
  getStripe: getStripeMock,
}));

import { POST } from "@/app/api/stripe/portal/route";

describe("stripe portal route POST", () => {
  beforeEach(() => {
    authMock.mockReset();
    getBillingStateMock.mockReset();
    getStripeMock.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/stripe/portal", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "You must be signed in to manage billing.",
    });
  });

  it("rejects accounts without a Stripe customer", async () => {
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

    const response = await POST(
      new Request("http://localhost/api/stripe/portal", { method: "POST" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No Stripe customer was found for this account.",
    });
  });

  it("creates a Stripe billing portal session", async () => {
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
    const createPortalSessionMock = vi.fn().mockResolvedValue({
      url: "https://billing.stripe.com/session",
    });
    getStripeMock.mockReturnValue({
      billingPortal: {
        sessions: {
          create: createPortalSessionMock,
        },
      },
    });

    const response = await POST(
      new Request("http://localhost/api/stripe/portal", { method: "POST" }),
    );

    expect(createPortalSessionMock).toHaveBeenCalledWith({
      customer: "cus_123",
      return_url: "http://localhost/settings",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://billing.stripe.com/session",
    });
  });
});
