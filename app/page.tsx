"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ROUTE_ONBOARDING, resolveHomePathForRoles } from "@/lib/routes";
import { doc, getDoc } from "firebase/firestore";
import { userDoc } from "@/lib/paths";
import { CookieConsent } from "@/components/common/cookie-consent";
import { MobileLandingView } from "@/components/marketing/mobile-landing-view";
import { DesktopLandingView } from "@/components/marketing/desktop-landing-view";
import { useTranslation } from "react-i18next";

import { AnimatedLogo } from "@/components/common/animated-logo";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation(["common", "landing"]);

  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // UI state
  const [loginOpen, setLoginOpen] = useState(false);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // AdSense should only load on desktop public marketing view
  const shouldLoadAds = !isLoggedIn && !loginOpen && hasConsent === true;

  // Authentication state management
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is logged in, set redirect flag and show loading
        setShouldRedirect(true);
        setLoginOpen(false);

        // User is logged in, redirect to appropriate home page
        try {
          const snap = await getDoc(userDoc(user.uid));
          if (!snap.exists()) {
            router.push(ROUTE_ONBOARDING);
            return;
          }
          const data = snap.data() as any;
          const roles = data?.roles || { grower: true, consumer: false };
          router.push(resolveHomePathForRoles(roles));
          return;
        } catch (error: any) {
          // If there's an error, just go to dashboard
          router.push(
            resolveHomePathForRoles({ grower: true, consumer: false })
          );
          return;
        }
      } else {
        setIsLoggedIn(false);
        setShouldRedirect(false);
        setCheckingAuth(false);
      }
    });
    return () => unsub();
  }, [router]);

  // PWA Install prompt handling
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
  }, []);

  // Handle login modal query parameter
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "1") {
      setLoginOpen(true);
    }
  }, []);

  // Cookie consent state management
  useEffect(() => {
    if (typeof window === "undefined") return;
    const consent = localStorage.getItem("cookie-consent");
    if (consent === "accepted") setHasConsent(true);
    else if (consent === "declined") setHasConsent(false);
    else setHasConsent(null);

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setHasConsent(detail === "accepted");
    };
    window.addEventListener("cookie-consent-changed", onChange as any);
    return () =>
      window.removeEventListener("cookie-consent-changed", onChange as any);
  }, []);

  // Handlers
  const handleDesktopLoginClick = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoginOpen(true);
      return;
    }
    try {
      const snap = await getDoc(userDoc(user.uid));
      if (!snap.exists()) {
        router.push(ROUTE_ONBOARDING);
        return;
      }
      const data = snap.data() as any;
      const roles = data?.roles || { grower: true, consumer: false };
      router.push(resolveHomePathForRoles(roles));
    } catch {
      router.push(resolveHomePathForRoles({ grower: true, consumer: false }));
    }
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // Show full-screen loading for authenticated users to prevent flash
  if (shouldRedirect || (checkingAuth && auth.currentUser)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <AnimatedLogo
            size={64}
            className="text-primary mb-4"
            duration={1.5}
          />
          <p className="text-lg font-medium text-foreground">
            {t("loading", { ns: "common" })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Load AdSense only on desktop public marketing view */}
      {shouldLoadAds && (
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1027418154196814"
          crossOrigin="anonymous"
        />
      )}

      {/* Mobile Layout - Direct Login Screen */}
      <div className="block lg:hidden">
        <MobileLandingView />
      </div>

      {/* Desktop Layout - Marketing Page */}
      <div className="hidden lg:block">
        <DesktopLandingView
          isLoggedIn={isLoggedIn}
          loginOpen={loginOpen}
          onLoginOpenChange={setLoginOpen}
          onLoginClick={handleDesktopLoginClick}
          onAuthStart={() => {}}
          deferredPrompt={deferredPrompt}
          onInstallPWA={handleInstallPWA}
        />
      </div>

      {/* Cookie consent banner */}
      <CookieConsent />
    </div>
  );
}
