import {
  createRateLimitUnavailableResponse,
  getRateLimitErrorCode,
  getRateLimitMessage,
  getRateLimitMessageFromCode,
  getRateLimitMinutesUntilReset,
  getRateLimitUnavailableErrorCode,
  getRequestIp,
} from "@/lib/rate-limit";

describe("rate-limit utilities", () => {
  it("uses the first forwarded IP address", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 198.51.100.4",
      },
    });

    expect(getRequestIp(request)).toBe("203.0.113.10");
  });

  it("falls back through alternate IP headers", () => {
    const request = new Request("https://example.com", {
      headers: {
        "cf-connecting-ip": "198.51.100.8",
      },
    });

    expect(getRequestIp(request)).toBe("198.51.100.8");
  });

  it("rounds rate limit reset times up to whole minutes", () => {
    vi.setSystemTime(new Date("2026-04-15T12:00:00.000Z"));

    expect(
      getRateLimitMinutesUntilReset(Date.parse("2026-04-15T12:00:01.000Z")),
    ).toBe(1);
    expect(
      getRateLimitMinutesUntilReset(Date.parse("2026-04-15T12:02:01.000Z")),
    ).toBe(3);
  });

  it("creates consistent messages and error codes", () => {
    vi.setSystemTime(new Date("2026-04-15T12:00:00.000Z"));
    const reset = Date.parse("2026-04-15T12:01:30.000Z");

    expect(getRateLimitMessage(reset)).toBe(
      "Too many attempts. Please try again in 2 minutes.",
    );
    expect(getRateLimitErrorCode(reset)).toBe("rate_limited_2");
    expect(getRateLimitMessageFromCode("rate_limited_2")).toBe(
      "Too many attempts. Please try again in 2 minutes.",
    );
    expect(getRateLimitMessageFromCode(getRateLimitUnavailableErrorCode())).toBe(
      "Auth protection is temporarily unavailable. Please try again shortly.",
    );
    expect(getRateLimitMessageFromCode("rate_limited_bad")).toBeNull();
  });

  it("returns a 503 response when rate limiting is unavailable", async () => {
    const response = createRateLimitUnavailableResponse();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Auth protection is temporarily unavailable. Please try again shortly.",
    });
  });
});

describe("checkAuthRateLimit", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("fails closed in production when Upstash is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", undefined);
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", undefined);

    const { checkAuthRateLimit, isRateLimitUnavailable } = await import("@/lib/rate-limit");
    const result = await checkAuthRateLimit({
      keyBy: "ip",
      request: new Request("https://example.com"),
      type: "login",
    });

    expect(result.success).toBe(false);
    expect(isRateLimitUnavailable(result)).toBe(true);
  });

  it("bypasses rate limiting outside production when Upstash is not configured", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", undefined);
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", undefined);

    const { checkAuthRateLimit, isRateLimitUnavailable } = await import("@/lib/rate-limit");
    const result = await checkAuthRateLimit({
      keyBy: "ip",
      request: new Request("https://example.com"),
      type: "login",
    });

    expect(result.success).toBe(true);
    expect(isRateLimitUnavailable(result)).toBe(false);
  });
});
