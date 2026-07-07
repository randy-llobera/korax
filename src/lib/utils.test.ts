import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names and resolves Tailwind conflicts", () => {
    expect(cn("px-2 py-1", undefined, "px-4")).toBe("py-1 px-4");
  });

  it("ignores falsy values", () => {
    expect(cn("flex", false && "hidden", null, "items-center")).toBe(
      "flex items-center",
    );
  });
});
