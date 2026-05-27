"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { getDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";

import ThemeLogo from "@/components/common/theme-logo";
import { auth } from "@/lib/firebase";
import { userDoc } from "@/lib/paths";
import { ROUTE_DASHBOARD, ROUTE_LOGIN, ROUTE_ONBOARDING } from "@/lib/routes";
import type { UserProfile } from "@/types";

type FirebaseTokenResponse = {
  customToken?: string;
  error?: string;
};

export default function AuthFinishPage() {
  const router = useRouter();
  const { t } = useTranslation(["auth"]);
  const [message, setMessage] = useState(() =>
    t("oauth.connectingAccount", { ns: "auth" }),
  );

  useEffect(() => {
    let isActive = true;

    const finishSignIn = async () => {
      try {
        const response = await fetch("/api/auth/firebase-token", {
          method: "POST",
        });
        const data = (await response.json()) as FirebaseTokenResponse;

        if (!response.ok || !data.customToken) {
          throw new Error(data.error || "firebase_token_failed");
        }

        setMessage(t("oauth.preparingSpace", { ns: "auth" }));
        const credential = await signInWithCustomToken(auth, data.customToken);
        const profile = await getDoc(userDoc<UserProfile>(credential.user.uid));

        if (!isActive) {
          return;
        }

        router.replace(profile.exists() ? ROUTE_DASHBOARD : ROUTE_ONBOARDING);
      } catch {
        if (!isActive) {
          return;
        }

        setMessage(t("oauth.firebaseAdminMissing", { ns: "auth" }));
        window.setTimeout(() => router.replace(ROUTE_LOGIN), 3500);
      }
    };

    void finishSignIn();

    return () => {
      isActive = false;
    };
  }, [router, t]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <ThemeLogo size={56} className="text-primary" />
        <p className="text-base font-medium text-foreground">{message}</p>
      </div>
    </main>
  );
}
