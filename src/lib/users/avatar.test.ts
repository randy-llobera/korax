import { getUserAvatarName, getUserInitials } from "@/lib/users/avatar";

describe("user-avatar utilities", () => {
  it("builds initials from up to three name parts", () => {
    expect(getUserInitials("ada lovelace byron")).toBe("ALB");
  });

  it("falls back to U when no name is available", () => {
    expect(getUserInitials("   ")).toBe("U");
    expect(getUserInitials(null)).toBe("U");
  });

  it("prefers a trimmed name for avatar display", () => {
    expect(
      getUserAvatarName({
        email: "ada@example.com",
        name: "  Ada Lovelace  ",
      }),
    ).toBe("Ada Lovelace");
  });

  it("falls back to the email local part or User", () => {
    expect(
      getUserAvatarName({
        email: "ada@example.com",
        name: "",
      }),
    ).toBe("ada");

    expect(
      getUserAvatarName({
        email: "   ",
        name: undefined,
      }),
    ).toBe("User");
  });
});
