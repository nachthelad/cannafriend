"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Leaf, PlayCircle } from "lucide-react";
import { ROUTE_LOGIN, ROUTE_PRIVACY, ROUTE_TERMS } from "@/lib/routes";
import ThemeLogo from "@/components/common/theme-logo";

export function MobileLandingView() {
  const { t } = useTranslation(["common", "landing"]);
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col justify-between p-6">
      <div className="pt-10 text-center">
        <ThemeLogo size={48} className="text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("app.name")}
        </h1>
        <p className="mx-auto max-w-sm text-gray-600 dark:text-gray-300">
          {t("app.description")}
        </p>
      </div>

      <div className="my-10 rounded-2xl border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Leaf className="h-8 w-8" />
        </div>
        <h2 className="mb-3 text-2xl font-semibold text-foreground">
          {t("hero.subtitle", { ns: "landing" })}
        </h2>
        <p className="mb-6 text-sm leading-6 text-muted-foreground">
          {t("hero.description", { ns: "landing" })}
        </p>
        <Button
          className="w-full"
          size="lg"
          onClick={() => router.push(ROUTE_LOGIN)}
        >
          <PlayCircle className="mr-2 h-5 w-5" />
          {t("hero.startFree", { ns: "landing" })}
        </Button>
      </div>

      <footer className="mt-8 pt-6">
        <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
          <Link
            href={ROUTE_PRIVACY}
            className="hover:text-primary transition-colors"
          >
            {t("privacy.title")}
          </Link>
          <span>•</span>
          <Link
            href={ROUTE_TERMS}
            className="hover:text-primary transition-colors"
          >
            {t("terms.title")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
