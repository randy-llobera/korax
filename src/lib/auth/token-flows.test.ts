import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  bcryptHashMock,
  userFindUniqueMock,
  userUpdateManyMock,
  verificationTokenDeleteManyMock,
  verificationTokenDeleteMock,
  verificationTokenFindUniqueMock,
} =
  vi.hoisted(() => ({
    bcryptHashMock: vi.fn(),
    userFindUniqueMock: vi.fn(),
    userUpdateManyMock: vi.fn(),
    verificationTokenDeleteManyMock: vi.fn(),
    verificationTokenDeleteMock: vi.fn(),
    verificationTokenFindUniqueMock: vi.fn(),
  }));

vi.mock("bcryptjs", () => ({
  default: {
    hash: bcryptHashMock,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: userFindUniqueMock,
      update: userUpdateManyMock,
      updateMany: userUpdateManyMock,
    },
    verificationToken: {
      delete: verificationTokenDeleteMock,
      deleteMany: verificationTokenDeleteManyMock,
      findUnique: verificationTokenFindUniqueMock,
    },
  },
}));

vi.mock("resend", () => ({
  Resend: vi.fn(),
}));

import { resetPasswordWithToken, verifyEmailToken } from "@/lib/auth/token-flows";
import { hashVerificationToken } from "@/lib/auth/email-verification";

describe("auth token flows", () => {
  beforeEach(() => {
    bcryptHashMock.mockReset();
    userFindUniqueMock.mockReset();
    verificationTokenDeleteManyMock.mockReset();
    verificationTokenDeleteMock.mockReset();
    verificationTokenFindUniqueMock.mockReset();
    userUpdateManyMock.mockReset();
    bcryptHashMock.mockResolvedValue("hashed-password");
  });

  it("verifies email tokens and consumes matching verification tokens", async () => {
    const rawToken = "verification-token";
    const hashedToken = hashVerificationToken(rawToken);
    verificationTokenFindUniqueMock.mockResolvedValue({
      expires: new Date(Date.now() + 60_000),
      identifier: "user@example.com",
      token: hashedToken,
    });
    userUpdateManyMock.mockResolvedValue({ count: 1 });

    await expect(verifyEmailToken(rawToken)).resolves.toBe("verified");

    expect(verificationTokenFindUniqueMock).toHaveBeenCalledWith({
      where: { token: hashedToken },
    });
    expect(userUpdateManyMock).toHaveBeenCalledWith({
      data: {
        emailVerified: expect.any(Date),
      },
      where: { email: "user@example.com" },
    });
    expect(verificationTokenDeleteManyMock).toHaveBeenCalledWith({
      where: { identifier: "user@example.com" },
    });
  });

  it("rejects password reset tokens without consuming them", async () => {
    const rawToken = "reset-token";
    const hashedToken = hashVerificationToken(rawToken);
    verificationTokenFindUniqueMock.mockResolvedValue({
      expires: new Date(Date.now() + 60_000),
      identifier: "password-reset:user@example.com",
      token: hashedToken,
    });

    await expect(verifyEmailToken(rawToken)).resolves.toBe("invalid");

    expect(verificationTokenFindUniqueMock).toHaveBeenCalledWith({
      where: { token: hashedToken },
    });
    expect(userUpdateManyMock).not.toHaveBeenCalled();
    expect(verificationTokenDeleteMock).not.toHaveBeenCalled();
    expect(verificationTokenDeleteManyMock).not.toHaveBeenCalled();
  });

  it("does not delete expired password reset tokens", async () => {
    const rawToken = "expired-reset-token";
    verificationTokenFindUniqueMock.mockResolvedValue({
      expires: new Date(Date.now() - 60_000),
      identifier: "password-reset:user@example.com",
      token: hashVerificationToken(rawToken),
    });

    await expect(verifyEmailToken(rawToken)).resolves.toBe("invalid");

    expect(userUpdateManyMock).not.toHaveBeenCalled();
    expect(verificationTokenDeleteMock).not.toHaveBeenCalled();
    expect(verificationTokenDeleteManyMock).not.toHaveBeenCalled();
  });

  it("resets passwords with valid reset tokens and consumes matching reset tokens", async () => {
    const rawToken = "reset-token";
    const hashedToken = hashVerificationToken(rawToken);
    verificationTokenFindUniqueMock.mockResolvedValue({
      expires: new Date(Date.now() + 60_000),
      identifier: "password-reset:user@example.com",
      token: hashedToken,
    });
    userFindUniqueMock.mockResolvedValue({
      id: "user-1",
      password: "current-hash",
    });

    await expect(
      resetPasswordWithToken({ password: "new-password", token: rawToken })
    ).resolves.toEqual({
      email: "user@example.com",
      status: "reset",
    });

    expect(verificationTokenFindUniqueMock).toHaveBeenCalledWith({
      where: { token: hashedToken },
    });
    expect(userFindUniqueMock).toHaveBeenCalledWith({
      select: {
        id: true,
        password: true,
      },
      where: { email: "user@example.com" },
    });
    expect(userUpdateManyMock).toHaveBeenCalledWith({
      data: { password: "hashed-password" },
      where: { id: "user-1" },
    });
    expect(verificationTokenDeleteManyMock).toHaveBeenCalledWith({
      where: { identifier: "password-reset:user@example.com" },
    });
  });

  it("rejects email verification tokens during password reset without consuming them", async () => {
    const rawToken = "verification-token";
    const hashedToken = hashVerificationToken(rawToken);
    verificationTokenFindUniqueMock.mockResolvedValue({
      expires: new Date(Date.now() + 60_000),
      identifier: "user@example.com",
      token: hashedToken,
    });

    await expect(
      resetPasswordWithToken({ password: "new-password", token: rawToken })
    ).resolves.toEqual({ status: "invalid" });

    expect(verificationTokenFindUniqueMock).toHaveBeenCalledWith({
      where: { token: hashedToken },
    });
    expect(userFindUniqueMock).not.toHaveBeenCalled();
    expect(verificationTokenDeleteMock).not.toHaveBeenCalled();
    expect(verificationTokenDeleteManyMock).not.toHaveBeenCalled();
  });

  it("does not delete expired email verification tokens during password reset", async () => {
    const rawToken = "expired-verification-token";
    verificationTokenFindUniqueMock.mockResolvedValue({
      expires: new Date(Date.now() - 60_000),
      identifier: "user@example.com",
      token: hashVerificationToken(rawToken),
    });

    await expect(
      resetPasswordWithToken({ password: "new-password", token: rawToken })
    ).resolves.toEqual({ status: "invalid" });

    expect(userFindUniqueMock).not.toHaveBeenCalled();
    expect(verificationTokenDeleteMock).not.toHaveBeenCalled();
    expect(verificationTokenDeleteManyMock).not.toHaveBeenCalled();
  });
});
