export function getSafeInternalPath(value: unknown): string {
  if (
    typeof value !== "string"
    || !value.startsWith("/")
    || value.startsWith("//")
    || value.includes("\\")
    || /[\u0000-\u001f]/.test(value)
  ) {
    return "/";
  }

  try {
    const url = new URL(value, "https://finleaf.invalid");
    if (url.origin !== "https://finleaf.invalid") return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
