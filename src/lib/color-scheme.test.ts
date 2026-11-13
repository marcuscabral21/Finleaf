import { describe, expect, it } from "vitest";
import { resolveDarkMode } from "./color-scheme";

describe("resolveDarkMode", () => {
  it("follows the device preference in system mode", () => {
    expect(resolveDarkMode("system", true)).toBe(true);
    expect(resolveDarkMode("system", false)).toBe(false);
  });

  it("respects explicit light and dark preferences", () => {
    expect(resolveDarkMode("light", true)).toBe(false);
    expect(resolveDarkMode("dark", false)).toBe(true);
  });
});
