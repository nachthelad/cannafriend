"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { recoverAuthState } from "@/lib/auth-utils";
import { ROUTE_ONBOARDING, resolveHomePathForRoles } from "@/lib/routes";
import { doc, getDoc } from "firebase/firestore";
import { userDoc } from "@/lib/paths";
import { CookieConsent } from "@/components/common/cookie-consent";
import { AuthLoadingView } from "@/components/marketing/auth-loading-view";
import { MobileLandingView } from "@/components/marketing/mobile-landing-view";
import { DesktopLandingView } from "@/components/marketing/desktop-landing-view";

export default function Home() {
  const router = useRouter();
  
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // UI state
  const [loginOpen, setLoginOpen] = useState(false);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // AdSense should only load on desktop public marketing view
  const shouldLoadAds = !isLoggedIn && !loginOpen && hasConsent === true;

  // Authentication state management
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let unsubscribed = false;
    let authResolved = false;
    
    const handleAuthComplete = () => {
      if (!authResolved && !unsubscribed) {
        authResolved = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };
    
    // Recover any corrupted auth state first
    recoverAuthState();
    
    // Set a shorter timeout to prevent hanging indefinitely
    timeoutId = setTimeout(() => {
      if (!unsubscribed && !authResolved) {
        console.warn('⚠️ Auth state check timed out, proceeding without user');
        setIsLoggedIn(false);
        setCheckingAuth(false);
        authResolved = true;
      }
    }, 5000); // 5 second timeout
    
    // Also try to get current user immediately (sometimes onAuthStateChanged doesn't fire)
    const checkCurrentUser = async () => {
      if (authResolved || unsubscribed) return;
      
      try {
        await auth.authStateReady();
        const currentUser = auth.currentUser;
        
        if (currentUser && !authResolved && !unsubscribed) {
          handleAuthComplete();
          setLoginOpen(false);
          
          try {
            const snap = await getDoc(userDoc(currentUser.uid));
            if (!snap.exists()) {
              router.push(ROUTE_ONBOARDING);
              return;
            }
            const data = snap.data() as any;
            const roles = data?.roles || { grower: true, consumer: false };
            router.push(resolveHomePathForRoles(roles));
            return;
          } catch (error: any) {
            if (error.code === 'auth/user-token-expired') {
              await recoverAuthState();
            }
            router.push(resolveHomePathForRoles({ grower: true, consumer: false }));
            return;
          }
        }
        
        if (!authResolved && !unsubscribed) {
          handleAuthComplete();
          setIsLoggedIn(Boolean(currentUser));
          setCheckingAuth(false);
        }
      } catch (error) {
        console.warn('Error checking current user:', error);
        if (!authResolved && !unsubscribed) {
          handleAuthComplete();
          setIsLoggedIn(false);
          setCheckingAuth(false);
        }
      }
    };
    
    // Try immediate check
    checkCurrentUser();
    
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (unsubscribed || authResolved) return;
      
      handleAuthComplete();
      
      if (user) {
        setLoginOpen(false);
        
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
          if (error.code === 'auth/user-token-expired') {
            await recoverAuthState();
          }
          router.push(resolveHomePathForRoles({ grower: true, consumer: false }));
          return;
        }
      }
      setIsLoggedIn(Boolean(user));
      setCheckingAuth(false);
    });
    
    return () => {
      unsubscribed = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      unsub();
    };
  }, [router]);

  // PWA Install prompt handling
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
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

  // Show loading view while checking authentication
  if (checkingAuth) {
    return <AuthLoadingView />;
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
          deferredPrompt={deferredPrompt}
          onInstallPWA={handleInstallPWA}
        />
      </div>

      {/* Cookie consent banner */}
      <CookieConsent />
    </div>
  );
}