import { describe, expect, it } from "vitest";
import {
  isValidTimeZone,
  isWebhookSecretValid,
  parseTelegramAmountCents,
} from "./telegram";

describe("Telegram input helpers", () => {
  it("parses euro amounts with comma or dot decimals into cents", () => {
    expect(parseTelegramAmountCents("12")).toBe(1200);
    expect(parseTelegramAmountCents("12,5")).toBe(1250);
    expect(parseTelegramAmountCents("12.34")).toBe(1234);
  });

  it("rejects malformed, zero, and excessive amounts", () => {
    expect(parseTelegramAmountCents("0")).toBeNull();
    expect(parseTelegramAmountCents("-2")).toBeNull();
    expect(parseTelegramAmountCents("1,234")).toBeNull();
    expect(parseTelegramAmountCents("10000000")).toBeNull();
  });

  it("accepts valid IANA time zones and rejects invalid ones", () => {
    expect(isValidTimeZone("Europe/Lisbon")).toBe(true);
    expect(isValidTimeZone("not/a-time-zone")).toBe(false);
  });

  it("compares webhook secrets without accepting missing or different values", () => {
    expect(isWebhookSecretValid("secret", "secret")).toBe(true);
    expect(isWebhookSecretValid("other", "secret")).toBe(false);
    expect(isWebhookSecretValid(null, "secret")).toBe(false);
  });
});
