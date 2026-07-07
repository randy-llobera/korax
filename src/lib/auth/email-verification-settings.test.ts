import { isEmailVerificationEnabled } from "@/lib/auth/email-verification-settings";

describe("isEmailVerificationEnabled", () => {
  it("defaults to true when the env var is missing", () => {
    vi.stubEnv("EMAIL_VERIFICATION_ENABLED", undefined);

    expect(isEmailVerificationEnabled()).toBe(true);
  });

  it("parses truthy values", () => {
    vi.stubEnv("EMAIL_VERIFICATION_ENABLED", "yes");

    expect(isEmailVerificationEnabled()).toBe(true);
  });

  it("parses falsy values", () => {
    vi.stubEnv("EMAIL_VERIFICATION_ENABLED", "off");

    expect(isEmailVerificationEnabled()).toBe(false);
  });

  it("falls back to the default for invalid values", () => {
    vi.stubEnv("EMAIL_VERIFICATION_ENABLED", "maybe");

    expect(isEmailVerificationEnabled()).toBe(true);
  });
});
