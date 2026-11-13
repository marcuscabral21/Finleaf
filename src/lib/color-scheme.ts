export type ThemePreference = "system" | "light" | "dark";

export function resolveDarkMode(
  preference: ThemePreference,
  systemPrefersDark: boolean,
) {
  return preference === "dark"
    || (preference === "system" && systemPrefersDark);
}
