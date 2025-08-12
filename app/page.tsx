"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { ROUTE_LOGIN, resolveHomePathForRoles } from "@/lib/routes";
import { doc, getDoc } from "firebase/firestore";
import { userDoc } from "@/lib/paths";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import Logo from "@/components/common/logo";
import { MobileHeader } from "@/components/marketing/mobile-header";
import { AppIntroduction } from "@/components/marketing/app-introduction";
import { FeaturesSection } from "@/components/marketing/features-section";
// Unify features into a single responsive component
import { LoginModal } from "@/components/auth/login-modal";

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(Boolean(user));
      setCheckingAuth(false);
    });
    return () => unsub();
  }, []);

  // Open modal if query param auth=1 is present
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "1") {
      setLoginOpen(true);
    }
  }, []);

  const handleDesktopLoginClick = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push(ROUTE_LOGIN);
      return;
    }
    try {
      const snap = await getDoc(userDoc(user.uid));
      if (!snap.exists()) {
        router.push("/onboarding");
        return;
      }
      const data = snap.data() as any;
      const roles = data?.roles || { grower: true, consumer: false };
      router.push(resolveHomePathForRoles(roles));
    } catch {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Mobile Layout */}
      <div className="block lg:hidden">
        <div className="p-4">
          {/* Header with login buttons */}
          <MobileHeader onLoginClick={() => setLoginOpen(true)} />

          {/* App Introduction */}
          <AppIntroduction />

          {/* Features Grid */}
          <FeaturesSection className="mb-8" />

          {/* Login Modal trigger handled by header button */}
        </div>
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen flex-col">
        {/* Top bar with login button */}
        <div className="h-16 flex items-center justify-end px-8">
          <Button
            onClick={() => {
              if (isLoggedIn) {
                void handleDesktopLoginClick();
              } else {
                setLoginOpen(true);
              }
            }}
            disabled={checkingAuth}
          >
            {isLoggedIn ? t("nav.goToApp" as any) : t("login.title")}
          </Button>
        </div>

        {/* Hero */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-3xl">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              <Logo size={36} className="text-primary" /> {t("app.name")}
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-200">
              {t("landing.hero")}
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="flex-1 flex justify-center p-8 pt-0">
          <div className="w-full max-w-6xl">
            <FeaturesSection className="grid-cols-2" />
          </div>
        </div>
      </div>
      {/* Desktop modal as well */}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
