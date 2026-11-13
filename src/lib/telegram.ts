import { timingSafeEqual } from "node:crypto";

export function parseTelegramAmountCents(value: string): number | null {
  const normalized = value.trim();
  const match = /^(\d{1,7})(?:[,.](\d{1,2}))?$/.exec(normalized);
  if (!match) return null;

  const whole = Number(match[1]);
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  const amount = whole * 100 + cents;
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

export function isValidTimeZone(value: string): boolean {
  if (!value || value.length > 80) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function isWebhookSecretValid(
  received: string | null,
  expected: string,
): boolean {
  if (!received) return false;
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return receivedBytes.length === expectedBytes.length
    && timingSafeEqual(receivedBytes, expectedBytes);
}
