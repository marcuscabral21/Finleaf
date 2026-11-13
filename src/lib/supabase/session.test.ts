import { describe, expect, it } from "vitest";
import { isDeletedUserSessionError } from "./session";

describe("isDeletedUserSessionError", () => {
  it("recognizes the Supabase error for a deleted account", () => {
    expect(isDeletedUserSessionError({
      code: "user_not_found",
      message: "User from sub claim in JWT does not exist",
    })).toBe(true);
  });

  it("does not suppress unrelated authentication errors", () => {
    expect(isDeletedUserSessionError({
      code: "bad_jwt",
      message: "Invalid JWT",
    })).toBe(false);
    expect(isDeletedUserSessionError(null)).toBe(false);
  });
});
