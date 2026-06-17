"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Download,
  FileCheck2,
  QrCode,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ANDROID_APK_SHA256,
  ANDROID_APK_URL,
  ANDROID_APK_VERSION,
  ANDROID_GUIDE_PATH,
  IS_ANDROID_APK_AVAILABLE,
  getAndroidGuideUrl,
} from "@/lib/android-apk";
import { cn } from "@/lib/utils";

type AndroidDownloadCardProps = {
  className?: string;
  compact?: boolean;
  showGuideLink?: boolean;
};

export function AndroidDownloadCard({
  className,
  compact = false,
  showGuideLink = true,
}: AndroidDownloadCardProps) {
  const { t } = useTranslation(["landing", "common"]);
  const guideUrl = getAndroidGuideUrl(process.env.NEXT_PUBLIC_BASE_URL);

  const hasChecksum = ANDROID_APK_SHA256.length > 0;
  const hasVersion = ANDROID_APK_VERSION.length > 0;

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-lg border-primary/20 bg-card shadow-sm",
        className,
      )}
    >
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={IS_ANDROID_APK_AVAILABLE ? "secondary" : "outline"}>
            <Smartphone aria-hidden="true" />
            {t("android.badge", { ns: "landing" })}
          </Badge>
          {hasVersion ? (
            <Badge variant="outline">
              <FileCheck2 aria-hidden="true" />
              {ANDROID_APK_VERSION}
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle className="text-2xl leading-tight">
            {IS_ANDROID_APK_AVAILABLE
              ? t("android.cardTitle", { ns: "landing" })
              : t("android.comingSoonTitle", { ns: "landing" })}
          </CardTitle>
          <CardDescription className="max-w-[58ch] text-base leading-7">
            {IS_ANDROID_APK_AVAILABLE
              ? t("android.cardDescription", { ns: "landing" })
              : t("android.comingSoonDescription", { ns: "landing" })}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            {IS_ANDROID_APK_AVAILABLE ? (
              <Button asChild size={compact ? "default" : "lg"}>
                <a href={ANDROID_APK_URL} rel="noopener noreferrer">
                  <Download data-icon="inline-start" aria-hidden="true" />
                  {t("android.downloadApk", { ns: "landing" })}
                </a>
              </Button>
            ) : null}

            {showGuideLink ? (
              <Button asChild variant="outline" size={compact ? "default" : "lg"}>
                <Link href={ANDROID_GUIDE_PATH}>
                  {t("android.openGuide", { ns: "landing" })}
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <ShieldCheck
                className="mt-0.5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>{t("android.safetyNote", { ns: "landing" })}</span>
            </div>
            {hasChecksum ? (
              <div className="break-all rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                SHA-256: {ANDROID_APK_SHA256}
              </div>
            ) : null}
          </div>
        </div>

        {IS_ANDROID_APK_AVAILABLE ? (
          <div className="flex w-full flex-col items-center gap-2 rounded-lg border bg-background p-4 md:w-[172px]">
            <QRCodeSVG
              value={guideUrl}
              size={132}
              level="M"
              includeMargin
              aria-label={t("android.qrLabel", { ns: "landing" })}
            />
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <QrCode aria-hidden="true" />
              {t("android.qrCaption", { ns: "landing" })}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
