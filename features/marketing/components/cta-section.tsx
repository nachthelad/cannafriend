"use client";

import type { CTASectionProps } from "@/types/marketing";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AndroidDownloadCard } from "@/features/marketing/components/android-download-card";
import { ROUTE_ANDROID_APP } from "@/lib/routes";
import { ArrowRight, PlayCircle } from "lucide-react";

export function CTASection({ onLoginClick, isLoggedIn }: CTASectionProps) {
  const { t } = useTranslation(["landing"]);

  return (
    <>
      <section id="android" className="px-4 py-14 md:px-6 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1fr] lg:items-center">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              {t("android.sectionKicker", { ns: "landing" })}
            </p>
            <h2 className="max-w-[14ch] text-3xl font-bold leading-tight md:text-5xl">
              {t("android.sectionTitle", { ns: "landing" })}
            </h2>
            <p className="max-w-[60ch] text-base leading-7 text-muted-foreground">
              {t("android.sectionDescription", { ns: "landing" })}
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button asChild variant="outline">
                <Link href={ROUTE_ANDROID_APP}>
                  {t("android.readGuide", { ns: "landing" })}
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <Image
              src="/illustrations/android-download-notebook.webp"
              alt={t("android.imageAlt", { ns: "landing" })}
              width={1440}
              height={960}
              className="h-auto w-full"
            />
            <AndroidDownloadCard />
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-8 md:px-6 md:pb-24">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 rounded-lg border bg-card px-5 py-10 text-center md:px-10 md:py-14">
          <h2 className="max-w-[18ch] text-3xl font-bold leading-tight md:text-5xl">
            {t("cta.title", { ns: "landing" })}
          </h2>
          <p className="max-w-[62ch] text-base leading-7 text-muted-foreground">
            {t("cta.description", { ns: "landing" })}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={onLoginClick} size="lg">
              <PlayCircle data-icon="inline-start" aria-hidden="true" />
              {isLoggedIn
                ? t("nav.goToApp", { ns: "landing" })
                : t("cta.startFreeNow", { ns: "landing" })}
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={ROUTE_ANDROID_APP}>
                {t("android.openGuide", { ns: "landing" })}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
