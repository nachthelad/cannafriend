"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import ThemeLogo from "@/components/common/theme-logo";

type FirebaseTokenResponse = {
  customToken?: string;
  error?: string;
};

function isAllowedMobileRedirect(value: string) {
  return value.startsWith("cannafriend://auth") || /^exp:\/\/.+\/--\/auth/.test(value);
}

function MobileAuthFinishContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation(["auth"]);
  const [message, setMessage] = useState(() =>
    t("oauth.connectingMobile", { ns: "auth" }),
  );
  const redirectTarget = useMemo(
    () => searchParams.get("redirect") ?? "cannafriend://auth",
    [searchParams],
  );

  useEffect(() => {
    const finishMobileSignIn = async () => {
      try {
        if (!isAllowedMobileRedirect(redirectTarget)) {
          throw new Error("invalid_redirect");
        }

        const response = await fetch("/api/auth/firebase-token", {
          method: "POST",
        });
        const data = (await response.json()) as FirebaseTokenResponse;

        if (!response.ok || !data.customToken) {
          throw new Error(data.error || "firebase_token_failed");
        }

        const separator = redirectTarget.includes("?") ? "&" : "?";
        window.location.replace(
          `${redirectTarget}${separator}ct=${encodeURIComponent(data.customToken)}`,
        );
      } catch {
        setMessage(t("oauth.mobileAccessError", { ns: "auth" }));
      }
    };

    void finishMobileSignIn();
  }, [redirectTarget, t]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <ThemeLogo size={56} className="text-primary" />
        <p className="text-base font-medium text-foreground">{message}</p>
      </div>
    </main>
  );
}

export default function MobileAuthFinishPage() {
  return (
    <Suspense fallback={null}>
      <MobileAuthFinishContent />
    </Suspense>
  );
}
