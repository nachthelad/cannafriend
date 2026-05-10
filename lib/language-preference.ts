export const LANGUAGE_PREFERENCE_COOKIE = "cannafriend_lang";

export type SupportedLocale = "en" | "es";

export function normalizeSupportedLocale(value: string | null | undefined): SupportedLocale {
  return value?.toLowerCase().startsWith("en") ? "en" : "es";
}

export function persistLanguagePreference(locale: SupportedLocale) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${LANGUAGE_PREFERENCE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  document.documentElement.lang = locale;
}
