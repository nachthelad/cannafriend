"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { ThemeToggle } from "@/components/common/theme-toggle";
import ThemeLogo from "@/components/common/theme-logo";
import { AndroidDownloadCard } from "@/features/marketing/components/android-download-card";
import { LandingFooter } from "@/features/marketing/components/landing-footer";
import { ANDROID_APK_SHA256, ANDROID_GUIDE_HASH } from "@/lib/android-apk";
import { ROUTE_HOME } from "@/lib/routes";
import { ArrowLeft, CheckCircle2, Settings, ShieldCheck } from "lucide-react";

const guideSteps = ["download", "permission", "install", "cleanup"] as const;

export default function AndroidAppPage() {
  const { t } = useTranslation(["landing", "common"]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <Link href={ROUTE_HOME} className="flex min-w-0 items-center gap-3">
            <ThemeLogo size={32} className="shrink-0 text-primary" />
            <span className="truncate text-xl font-bold">
              {t("app.name", { ns: "common" })}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-4 py-8 md:px-6 md:py-14">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1fr] lg:items-center">
            <div className="flex flex-col gap-6">
              <Button asChild variant="ghost" className="w-fit">
                <Link href={ROUTE_HOME}>
                  <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                  {t("android.backHome", { ns: "landing" })}
                </Link>
              </Button>

              <div className="flex flex-col gap-4">
                <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                  {t("android.pageKicker", { ns: "landing" })}
                </p>
                <h1 className="max-w-[13ch] text-4xl font-black leading-none md:text-6xl">
                  {t("android.pageTitle", { ns: "landing" })}
                </h1>
                <p className="max-w-[65ch] text-base leading-7 text-muted-foreground md:text-lg">
                  {t("android.pageDescription", { ns: "landing" })}
                </p>
              </div>

              <Alert className="rounded-lg">
                <ShieldCheck aria-hidden="true" />
                <AlertTitle>{t("android.trustTitle", { ns: "landing" })}</AlertTitle>
                <AlertDescription>
                  {t("android.trustDescription", { ns: "landing" })}
                </AlertDescription>
              </Alert>
            </div>

            <div className="rounded-lg border bg-card p-3 shadow-sm">
              <Image
                src="/illustrations/android-download-notebook.svg"
                alt={t("android.imageAlt", { ns: "landing" })}
                width={960}
                height={640}
                priority
                className="h-auto w-full rounded-md"
              />
            </div>
          </div>
        </section>

        <section id={ANDROID_GUIDE_HASH} className="px-4 py-10 md:px-6 md:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <AndroidDownloadCard showGuideLink={false} />

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {t("android.guideTitle", { ns: "landing" })}
                </CardTitle>
                <CardDescription className="text-base leading-7">
                  {t("android.guideDescription", { ns: "landing" })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {guideSteps.map((step, index) => (
                  <div
                    key={step}
                    className="grid grid-cols-[auto_1fr] gap-3 rounded-md border bg-background p-4"
                  >
                    <div className="flex size-9 items-center justify-center rounded-md bg-secondary text-sm font-bold text-secondary-foreground">
                      {index + 1}
                    </div>
                    <div className="flex flex-col gap-1">
                      <h2 className="font-semibold">
                        {t(`android.steps.${step}.title`, { ns: "landing" })}
                      </h2>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {t(`android.steps.${step}.description`, {
                          ns: "landing",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="px-4 pb-16 md:px-6 md:pb-24">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
            <Card className="rounded-lg">
              <CardHeader>
                <CheckCircle2 className="text-primary" aria-hidden="true" />
                <CardTitle>{t("android.notes.playProtect.title", { ns: "landing" })}</CardTitle>
                <CardDescription>
                  {t("android.notes.playProtect.description", { ns: "landing" })}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-lg">
              <CardHeader>
                <Settings className="text-primary" aria-hidden="true" />
                <CardTitle>{t("android.notes.permission.title", { ns: "landing" })}</CardTitle>
                <CardDescription>
                  {t("android.notes.permission.description", { ns: "landing" })}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-lg">
              <CardHeader>
                <ShieldCheck className="text-primary" aria-hidden="true" />
                <CardTitle>{t("android.notes.checksum.title", { ns: "landing" })}</CardTitle>
                <CardDescription>
                  {ANDROID_APK_SHA256
                    ? t("android.notes.checksum.withHash", { ns: "landing" })
                    : t("android.notes.checksum.noHash", { ns: "landing" })}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
