"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { ROUTE_PRIVACY, ROUTE_TERMS } from "@/lib/routes";
import Logo from "@/components/common/logo";

export function MobileLandingView() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col justify-center p-6">
      {/* Logo and App Name */}
      <div className="text-center mb-8">
        <Logo size={48} className="text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("app.name")}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t("app.description")}
        </p>
      </div>

      {/* Direct Auth Form */}
      <div className="w-full max-w-sm mx-auto">
        <AuthTabs />
      </div>

      {/* Mobile Footer */}
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