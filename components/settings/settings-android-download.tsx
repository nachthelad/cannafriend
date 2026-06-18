"use client";

import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Download, ShieldCheck, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ANDROID_APK_SHA256,
  ANDROID_APK_URL,
  ANDROID_APK_VERSION,
  IS_ANDROID_APK_AVAILABLE,
  getAndroidGuideUrl,
} from "@/lib/android-apk";

export function SettingsAndroidDownload() {
  const { t } = useTranslation(["landing"]);
  const guideUrl = getAndroidGuideUrl(process.env.NEXT_PUBLIC_BASE_URL);
  const hasDetails =
    ANDROID_APK_VERSION.length > 0 || ANDROID_APK_SHA256.length > 0;

  return (
    <section className="flex flex-col items-center gap-4 py-2 text-center">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Smartphone className="h-4 w-4 text-primary" aria-hidden="true" />
        <span>{t("android.settingsTitle", { ns: "landing" })}</span>
      </div>

      {IS_ANDROID_APK_AVAILABLE ? (
        <>
          <div className="rounded-2xl bg-white p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
            <QRCodeSVG
              value={guideUrl}
              size={128}
              level="M"
              includeMargin
              aria-label={t("android.qrLabel", { ns: "landing" })}
            />
          </div>

          <Button asChild size="sm" className="min-w-44 rounded-full">
            <a href={ANDROID_APK_URL} rel="noopener noreferrer">
              <Download data-icon="inline-start" aria-hidden="true" />
              {t("android.downloadApk", { ns: "landing" })}
            </a>
          </Button>
        </>
      ) : (
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          {t("android.comingSoonDescription", { ns: "landing" })}
        </p>
      )}

      {IS_ANDROID_APK_AVAILABLE ? (
        <details className="group w-full max-w-xl text-left">
          <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {t("android.viewInfo", { ns: "landing" })}
            <ChevronDown
              className="h-4 w-4 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>

          <div className="mt-3 space-y-3 rounded-2xl bg-muted/45 px-4 py-3 text-sm text-muted-foreground">
            {ANDROID_APK_VERSION ? (
              <p>
                <span className="font-medium text-foreground">
                  {t("android.versionLabel", { ns: "landing" })}:
                </span>{" "}
                {ANDROID_APK_VERSION}
              </p>
            ) : null}

            {ANDROID_APK_SHA256 ? (
              <p className="break-all font-mono text-xs">
                SHA-256: {ANDROID_APK_SHA256}
              </p>
            ) : null}

            <div className="flex items-start gap-2 leading-6">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>{t("android.safetyNote", { ns: "landing" })}</span>
            </div>

            {!hasDetails ? (
              <p>{t("android.noVerificationData", { ns: "landing" })}</p>
            ) : null}
          </div>
        </details>
      ) : null}
    </section>
  );
}
