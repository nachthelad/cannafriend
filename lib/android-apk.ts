import { ROUTE_ANDROID_APP } from "@/lib/routes";

export const ANDROID_GUIDE_HASH = "descarga";
export const ANDROID_GUIDE_PATH =
  `${ROUTE_ANDROID_APP}#${ANDROID_GUIDE_HASH}` as const;

export const ANDROID_APK_URL =
  process.env.NEXT_PUBLIC_ANDROID_APK_URL?.trim() || "";

export const ANDROID_APK_VERSION =
  process.env.NEXT_PUBLIC_ANDROID_APK_VERSION?.trim() || "";

export const ANDROID_APK_SHA256 =
  process.env.NEXT_PUBLIC_ANDROID_APK_SHA256?.trim() || "";

export const IS_ANDROID_APK_AVAILABLE = ANDROID_APK_URL.length > 0;

export function getAndroidGuideUrl(origin?: string | null) {
  if (!origin) {
    return ANDROID_GUIDE_PATH;
  }

  return `${origin}${ANDROID_GUIDE_PATH}`;
}
