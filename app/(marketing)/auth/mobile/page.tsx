"use client";

import { Suspense, useEffect, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import ThemeLogo from "@/components/common/theme-logo";

function isAllowedMobileRedirect(value: string) {
  return value.startsWith("cannafriend://auth") || /^exp:\/\/.+\/--\/auth/.test(value);
}

function MobileAuthContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation(["auth"]);
  const redirectTarget = useMemo(
    () => searchParams.get("redirect") ?? "cannafriend://auth",
    [searchParams],
  );

  useEffect(() => {
    const safeRedirect = isAllowedMobileRedirect(redirectTarget)
      ? redirectTarget
      : "cannafriend://auth";

    void signIn("google", {
      callbackUrl: `/auth/mobile/finish?redirect=${encodeURIComponent(safeRedirect)}`,
    });
  }, [redirectTarget]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <ThemeLogo size={56} className="text-primary" />
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="text-base font-medium text-foreground">
          {t("oauth.openingGoogle", { ns: "auth" })}
        </p>
      </div>
    </main>
  );
}

export default function MobileAuthPage() {
  return (
    <Suspense fallback={null}>
      <MobileAuthContent />
    </Suspense>
  );
}
