"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import dynamic from "next/dynamic";
import { ROUTE_DASHBOARD, ROUTE_LOGIN, ROUTE_ONBOARDING } from "@/lib/routes";
import { getDoc } from "firebase/firestore";
import { getPostAuthRedirect } from "@/lib/auth-redirect";
import { userDoc } from "@/lib/paths";
import { CookieConsent } from "@/components/common/cookie-consent";
import { useTranslation } from "react-i18next";
import type { BeforeInstallPromptEvent, UserProfile } from "@/types";
import { useAuthUser } from "@/hooks/use-auth-user";

// Dynamic imports for view components
const MobileLandingView = dynamic(
  () =>
    import("@/features/marketing/components/mobile-landing-view").then(
      (mod) => mod.MobileLandingView
    ),
  { ssr: false }
);
const DesktopLandingView = dynamic(
  () =>
    import("@/features/marketing/components/desktop-landing-view").then(
      (mod) => mod.DesktopLandingView
    ),
  { ssr: false }
);

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation(["common", "landing"]);
  const { user, isLoading: authLoading } = useAuthUser();

  const [resolvedAuthDestination, setResolvedAuthDestination] = useState<{
    userId: string;
    destination: typeof ROUTE_DASHBOARD | typeof ROUTE_ONBOARDING;
  } | null>(null);

  // UI state
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const isLoggedIn = Boolean(user);

  // AdSense should only load on desktop public marketing view
  const shouldLoadAds = !isLoggedIn && hasConsent === true;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      return;
    }

    let isActive = true;

    const resolveAuthenticatedDestination = async () => {
      try {
        const snap = await getDoc(userDoc<UserProfile>(user.uid));
        if (!isActive) {
          return;
        }

        setResolvedAuthDestination({
          userId: user.uid,
          destination: getPostAuthRedirect(
            snap.exists() ? snap.data() : null,
          ),
        });
      } catch {
        if (isActive) {
          setResolvedAuthDestination({
            userId: user.uid,
            destination: ROUTE_DASHBOARD,
          });
        }
      }
    };

    void resolveAuthenticatedDestination();

    return () => {
      isActive = false;
    };
  }, [authLoading, user]);

  // PWA Install prompt handling
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
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

  // Cookie consent state management
  useEffect(() => {
    if (typeof window === "undefined") return;
    const consent = localStorage.getItem("cookie_consent_v1");
    if (consent === "accepted") setHasConsent(true);
    else if (consent === "declined") setHasConsent(false);
    else setHasConsent(null);

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setHasConsent(detail === "accepted");
    };
    window.addEventListener("cookie_consent_changed_v1", onChange as any);
    return () =>
      window.removeEventListener("cookie_consent_changed_v1", onChange as any);
  }, []);

  // Handlers
  const handleAuthAction = () => {
    if (authDestination) {
      router.push(authDestination);
    }
  };

  const authDestination = user
    ? resolvedAuthDestination?.userId === user.uid
      ? resolvedAuthDestination.destination
      : null
    : ROUTE_LOGIN;
  const isAuthActionLoading = Boolean(user) && authDestination === null;
  const authActionLabel = isAuthActionLoading
    ? t("loading", { ns: "common" })
    : authDestination === ROUTE_ONBOARDING
      ? t("nav.completeSetup", { ns: "landing" })
      : authDestination === ROUTE_DASHBOARD
        ? t("nav.goToDashboard", { ns: "landing" })
        : t("nav.signIn", { ns: "landing" });

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // Wait only while Firebase restores the session. Profile resolution happens
  // in the background so authenticated users can remain on the landing page.
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mb-4" />
          <p className="text-lg font-medium text-foreground">
            {t("loading", { ns: "common" })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Load AdSense only on desktop public marketing view */}
      {shouldLoadAds ? (
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1027418154196814"
          crossOrigin="anonymous"
        />
      ) : null}

      <Suspense fallback={null}>
        {/* Mobile Layout - Direct Login Screen */}
        <div className="block lg:hidden">
          <MobileLandingView
            authActionLabel={authActionLabel}
            isAuthActionLoading={isAuthActionLoading}
            onAuthAction={handleAuthAction}
            deferredPrompt={deferredPrompt}
            onInstallPWA={handleInstallPWA}
          />
        </div>

        {/* Desktop Layout - Marketing Page */}
        <div className="hidden lg:block">
          <DesktopLandingView
            authActionLabel={authActionLabel}
            isAuthActionLoading={isAuthActionLoading}
            onAuthAction={handleAuthAction}
            deferredPrompt={deferredPrompt}
            onInstallPWA={handleInstallPWA}
          />
        </div>
      </Suspense>

      {/* Cookie consent banner */}
      <CookieConsent />
    </div>
  );
}
