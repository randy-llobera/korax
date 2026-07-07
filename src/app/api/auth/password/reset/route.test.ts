import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  checkAuthRateLimitMock,
  createRateLimitErrorResponseMock,
  createRateLimitUnavailableResponseMock,
  isRateLimitUnavailableMock,
  resetPasswordWithTokenMock,
} = vi.hoisted(() => ({
  checkAuthRateLimitMock: vi.fn(),
  createRateLimitErrorResponseMock: vi.fn(),
  createRateLimitUnavailableResponseMock: vi.fn(),
  isRateLimitUnavailableMock: vi.fn(),
  resetPasswordWithTokenMock: vi.fn(),
}));

vi.mock("@/lib/auth/token-flows", () => ({
  resetPasswordWithToken: resetPasswordWithTokenMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkAuthRateLimit: checkAuthRateLimitMock,
  createRateLimitErrorResponse: createRateLimitErrorResponseMock,
  createRateLimitUnavailableResponse: createRateLimitUnavailableResponseMock,
  isRateLimitUnavailable: isRateLimitUnavailableMock,
}));

vi.mock("resend", () => ({
  Resend: vi.fn(),
}));

import { POST } from "@/app/api/auth/password/reset/route";

describe("password reset route POST", () => {
  beforeEach(() => {
    checkAuthRateLimitMock.mockReset();
    createRateLimitErrorResponseMock.mockReset();
    createRateLimitUnavailableResponseMock.mockReset();
    isRateLimitUnavailableMock.mockReset();
    resetPasswordWithTokenMock.mockReset();
    checkAuthRateLimitMock.mockResolvedValue({ success: true });
  });

  it("returns an invalid response when the reset flow rejects the token", async () => {
    resetPasswordWithTokenMock.mockResolvedValue({ status: "invalid" });

    const response = await POST(
      new Request("http://localhost/api/auth/password/reset", {
        body: JSON.stringify({
          confirmPassword: "new-password",
          password: "new-password",
          token: "verification-token",
        }),
        method: "POST",
      })
    );

    expect(resetPasswordWithTokenMock).toHaveBeenCalledWith({
      password: "new-password",
      token: "verification-token",
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "That reset link is invalid or has expired.",
    });
  });

  it("returns success when the reset flow updates the password", async () => {
    resetPasswordWithTokenMock.mockResolvedValue({
      email: "user@example.com",
      status: "reset",
    });

    const response = await POST(
      new Request("http://localhost/api/auth/password/reset", {
        body: JSON.stringify({
          confirmPassword: "new-password",
          password: "new-password",
          token: "reset-token",
        }),
        method: "POST",
      })
    );

    expect(resetPasswordWithTokenMock).toHaveBeenCalledWith({
      password: "new-password",
      token: "reset-token",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      email: "user@example.com",
      success: true,
    });
  });
});
