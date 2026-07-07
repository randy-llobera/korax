import { afterEach, describe, expect, it, vi } from "vitest";

import { redirectToBillingUrl } from "@/lib/billing/client";

describe("billing client helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects to the billing URL returned by the API", async () => {
    const location = { href: "" };
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ url: "https://billing.example.com/session" }),
      ok: true,
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location });

    await redirectToBillingUrl("/api/stripe/checkout", { interval: "monthly" });

    expect(fetchMock).toHaveBeenCalledWith("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ interval: "monthly" }),
    });
    expect(location.href).toBe("https://billing.example.com/session");
  });

  it("throws the API error when no billing URL is returned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({ error: "Unable to start checkout." }),
        ok: false,
      }),
    );
    vi.stubGlobal("window", { location: { href: "" } });

    await expect(redirectToBillingUrl("/api/stripe/checkout")).rejects.toThrow(
      "Unable to start checkout.",
    );
  });
});
