"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { getDoc } from "firebase/firestore";

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
  const [message, setMessage] = useState("Conectando tu cuenta...");

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

        setMessage("Preparando tu espacio...");
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

        setMessage(
          "Google conecto, pero faltan credenciales de Firebase Admin para completar la sesion local.",
        );
        window.setTimeout(() => router.replace(ROUTE_LOGIN), 3500);
      }
    };

    void finishSignIn();

    return () => {
      isActive = false;
    };
  }, [router]);

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
