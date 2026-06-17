"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ROUTE_ANDROID_APP,
  ROUTE_HOME,
  ROUTE_PRIVACY,
  ROUTE_TERMS,
} from "@/lib/routes";
import ThemeLogo from "@/components/common/theme-logo";

export function LandingFooter() {
  const { t } = useTranslation(["landing", "common"]);
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 md:py-12">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <ThemeLogo size={32} className="text-primary" />
              <h2 className="text-xl font-bold">
                {t("app.name", { ns: "common" })}
              </h2>
            </div>
            <p className="max-w-[55ch] text-sm leading-6 text-muted-foreground">
              {t("footer.hero", { ns: "landing" })}
            </p>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <h3 className="font-semibold">{t("footer.features", { ns: "landing" })}</h3>
            <Link
              href={`${ROUTE_HOME}#how`}
              className="text-muted-foreground hover:text-foreground"
            >
              {t("nav.howItWorks", { ns: "landing" })}
            </Link>
            <Link
              href={`${ROUTE_HOME}#android`}
              className="text-muted-foreground hover:text-foreground"
            >
              {t("android.badge", { ns: "landing" })}
            </Link>
            <Link
              href={`${ROUTE_HOME}#ai`}
              className="text-muted-foreground hover:text-foreground"
            >
              {t("ai.badge", { ns: "landing" })}
            </Link>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <h3 className="font-semibold">{t("footer.support", { ns: "landing" })}</h3>
            <Link
              href={ROUTE_ANDROID_APP}
              className="text-muted-foreground hover:text-foreground"
            >
              {t("android.readGuide", { ns: "landing" })}
            </Link>
            <Link
              href={ROUTE_PRIVACY}
              className="text-muted-foreground hover:text-foreground"
            >
              {t("privacy.title", { ns: "common" })}
            </Link>
            <Link
              href={ROUTE_TERMS}
              className="text-muted-foreground hover:text-foreground"
            >
              {t("terms.title", { ns: "common" })}
            </Link>
            <a
              href="mailto:nachthelad.dev@gmail.com"
              className="text-muted-foreground hover:text-foreground"
            >
              {t("footer.contact", { ns: "landing" })}
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>{t("footer.copyright", { ns: "landing" })}</span>
          <span>{t("footer.version", { ns: "landing", version: appVersion })}</span>
        </div>
      </div>
    </footer>
  );
}
