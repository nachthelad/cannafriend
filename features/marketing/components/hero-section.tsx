"use client";

import type { HeroSectionProps } from "@/types/marketing";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Leaf, PlayCircle, ShieldCheck } from "lucide-react";
import {
  ANDROID_APK_URL,
  IS_ANDROID_APK_AVAILABLE,
} from "@/lib/android-apk";
import { ROUTE_ANDROID_APP } from "@/lib/routes";

export function HeroSection({
  authActionLabel,
  isAuthActionLoading,
  onAuthAction,
}: HeroSectionProps) {
  const { t } = useTranslation(["landing", "common"]);

  return (
    <section className="px-4 py-10 md:px-6 md:py-16">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1fr)] lg:items-center">
        <div className="flex flex-col items-start gap-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <Leaf aria-hidden="true" />
              {t("hero.kicker", { ns: "landing" })}
            </Badge>
            <Badge variant="outline">
              <ShieldCheck aria-hidden="true" />
              {t("hero.privateBadge", { ns: "landing" })}
            </Badge>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="max-w-[11ch] text-5xl font-black leading-[0.95] tracking-normal text-foreground md:text-7xl">
              {t("app.name", { ns: "common" })}
            </h1>
            <p className="max-w-[17ch] text-3xl font-semibold leading-tight text-foreground md:text-5xl">
              {t("hero.subtitle", { ns: "landing" })}
            </p>
            <p className="max-w-[62ch] text-base leading-7 text-muted-foreground md:text-lg">
              {t("hero.description", { ns: "landing" })}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {IS_ANDROID_APK_AVAILABLE ? (
              <Button asChild size="lg">
                <a href={ANDROID_APK_URL} rel="noopener noreferrer">
                  <Download data-icon="inline-start" aria-hidden="true" />
                  {t("android.downloadApk", { ns: "landing" })}
                </a>
              </Button>
            ) : null}

            <Button
              disabled={isAuthActionLoading}
              onClick={onAuthAction}
              size="lg"
              variant="outline"
            >
              <PlayCircle data-icon="inline-start" aria-hidden="true" />
              {authActionLabel}
            </Button>

            <Button asChild size="lg" variant="ghost">
              <Link href={ROUTE_ANDROID_APP}>
                {IS_ANDROID_APK_AVAILABLE
                  ? t("android.openGuide", { ns: "landing" })
                  : t("android.comingSoonTitle", { ns: "landing" })}
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[620px]">
          <Image
            src="/illustrations/cannafriend-hero-notebook.webp"
            alt={t("hero.imageAlt", { ns: "landing" })}
            width={1440}
            height={960}
            priority
            className="h-auto w-full rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.26)] dark:shadow-[0_28px_90px_rgba(0,0,0,0.55)]"
          />
        </div>
      </div>
    </section>
  );
}
