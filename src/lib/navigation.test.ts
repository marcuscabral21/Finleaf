import { describe, expect, it } from "vitest";
import { getSafeInternalPath } from "./navigation";

describe("getSafeInternalPath", () => {
  it("preserves safe internal destinations", () => {
    expect(getSafeInternalPath("/telegram/connect?token=abc")).toBe(
      "/telegram/connect?token=abc",
    );
  });

  it("rejects external and malformed destinations", () => {
    expect(getSafeInternalPath("https://example.com")).toBe("/");
    expect(getSafeInternalPath("//example.com")).toBe("/");
    expect(getSafeInternalPath("/\\example.com")).toBe("/");
  });
});
