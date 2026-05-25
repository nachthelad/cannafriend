"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  const [message, setMessage] = useState("Conectando con la app...");
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
        setMessage("No pudimos completar el acceso mobile.");
      }
    };

    void finishMobileSignIn();
  }, [redirectTarget]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <ThemeLogo size={56} className="text-primary" />
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
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
