import { cookies, headers } from "next/headers";

import enCommon from "@/lib/locales/en/common.json";
import esCommon from "@/lib/locales/es/common.json";
import {
  LANGUAGE_PREFERENCE_COOKIE,
  normalizeSupportedLocale,
} from "@/lib/language-preference";

type CommonMessages = typeof esCommon;

export async function getLegalPageCopy() {
  const requestHeaders = await headers();
  const cookieStore = await cookies();
  const selectedLanguage = cookieStore.get(LANGUAGE_PREFERENCE_COOKIE)?.value;
  const locale = selectedLanguage
    ? normalizeSupportedLocale(selectedLanguage)
    : normalizeSupportedLocale(requestHeaders.get("accept-language"));
  const messages: CommonMessages = locale === "en" ? enCommon : esCommon;

  return {
    locale,
    common: messages,
  };
}
