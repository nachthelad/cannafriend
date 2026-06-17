"use client";

import type { DesktopLandingViewProps } from "@/types/marketing";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/features/marketing/components/hero-section";
import { AppShowcase } from "@/features/marketing/components/app-showcase";
import { CTASection } from "@/features/marketing/components/cta-section";
import { LandingFooter } from "@/features/marketing/components/landing-footer";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { ThemeToggle } from "@/components/common/theme-toggle";
import ThemeLogo from "@/components/common/theme-logo";
import { ROUTE_ANDROID_APP } from "@/lib/routes";

export function DesktopLandingView({
  isLoggedIn,
  onLoginClick,
  deferredPrompt,
  onInstallPWA,
}: DesktopLandingViewProps) {
  const { t } = useTranslation(["common", "landing", "nav", "auth"]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
          <Link href="/" className="flex items-center gap-3">
            <ThemeLogo size={32} className="text-primary" />
            <span className="text-xl font-bold text-foreground">
              {t("app.name", { ns: "common" })}
            </span>
          </Link>

          <nav className="flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <a href="#how" className="transition-colors hover:text-foreground">
              {t("nav.howItWorks", { ns: "landing" })}
            </a>
            <a href="#android" className="transition-colors hover:text-foreground">
              {t("android.badge", { ns: "landing" })}
            </a>
            <a href="#ai" className="transition-colors hover:text-foreground">
              {t("ai.badge", { ns: "landing" })}
            </a>
            <Link
              href={ROUTE_ANDROID_APP}
              className="transition-colors hover:text-foreground"
            >
              {t("android.readGuide", { ns: "landing" })}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button onClick={onLoginClick}>
              {isLoggedIn
                ? t("dashboard", { ns: "nav" })
                : t("login.title", { ns: "auth" })}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <HeroSection
          onLoginClick={onLoginClick}
          deferredPrompt={deferredPrompt}
          onInstallPWA={onInstallPWA}
          isLoggedIn={isLoggedIn}
        />
        <AppShowcase />
        <CTASection
          onLoginClick={onLoginClick}
          deferredPrompt={deferredPrompt}
          onInstallPWA={onInstallPWA}
          isLoggedIn={isLoggedIn}
        />
      </main>

      <LandingFooter />
    </div>
  );
}
