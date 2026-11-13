export function isDeletedUserSessionError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;

  return (
    ("code" in error && error.code === "user_not_found")
    || ("message" in error && error.message === "User from sub claim in JWT does not exist")
  );
}
