"use client";

import type { DesktopLandingViewProps } from "@/types/marketing";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AndroidDownloadCard } from "@/features/marketing/components/android-download-card";
import { LandingFooter } from "@/features/marketing/components/landing-footer";
import { ROUTE_ANDROID_APP } from "@/lib/routes";
import ThemeLogo from "@/components/common/theme-logo";
import { Bell, Leaf, NotebookPen, PlayCircle } from "lucide-react";

const mobileProofItems = [
  { icon: Leaf, key: "plants" },
  { icon: NotebookPen, key: "journal" },
  { icon: Bell, key: "reminders" },
] as const;

export function MobileLandingView({
  isLoggedIn,
  onLoginClick,
}: DesktopLandingViewProps) {
  const { t } = useTranslation(["common", "landing"]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/92 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <ThemeLogo size={30} className="shrink-0 text-primary" />
            <span className="truncate text-lg font-bold">
              {t("app.name", { ns: "common" })}
            </span>
          </Link>
          <Button onClick={onLoginClick} size="sm" variant="outline">
            {isLoggedIn
              ? t("nav.goToApp", { ns: "landing" })
              : t("hero.openWebApp", { ns: "landing" })}
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="flex flex-col gap-7 px-4 py-8">
          <div className="flex flex-col gap-4">
            <Badge variant="secondary" className="w-fit">
              {t("hero.kicker", { ns: "landing" })}
            </Badge>
            <h1 className="max-w-[11ch] text-5xl font-black leading-[0.95]">
              {t("app.name", { ns: "common" })}
            </h1>
            <p className="text-2xl font-semibold leading-tight">
              {t("hero.subtitle", { ns: "landing" })}
            </p>
            <p className="text-base leading-7 text-muted-foreground">
              {t("hero.description", { ns: "landing" })}
            </p>
          </div>

          <AndroidDownloadCard compact />

          <Button onClick={onLoginClick} size="lg" variant="outline">
            <PlayCircle data-icon="inline-start" aria-hidden="true" />
            {isLoggedIn
              ? t("nav.goToApp", { ns: "landing" })
              : t("hero.openWebApp", { ns: "landing" })}
          </Button>

          <div className="rounded-lg border bg-card p-3">
            <Image
              src="/illustrations/android-download-notebook.svg"
              alt={t("android.imageAlt", { ns: "landing" })}
              width={960}
              height={640}
              priority
              className="h-auto w-full rounded-md"
            />
          </div>
        </section>

        <section id="how" className="flex flex-col gap-3 px-4 py-8">
          {mobileProofItems.map(({ icon: Icon, key }) => (
            <div key={key} className="flex gap-3 rounded-lg border bg-card p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <Icon aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold">
                  {t(`proof.${key}.title`, { ns: "landing" })}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t(`proof.${key}.description`, { ns: "landing" })}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section className="px-4 py-8">
          <div className="flex flex-col gap-4 rounded-lg border bg-secondary/60 p-5">
            <h2 className="text-2xl font-bold leading-tight">
              {t("flow.title", { ns: "landing" })}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("flow.description", { ns: "landing" })}
            </p>
            <Button asChild variant="outline">
              <Link href={ROUTE_ANDROID_APP}>
                {t("android.readGuide", { ns: "landing" })}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
