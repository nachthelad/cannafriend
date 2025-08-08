"use client";

import { MobileHeader } from "@/components/marketing/mobile-header";
import { AppIntroduction } from "@/components/marketing/app-introduction";
import { FeaturesSection } from "@/components/marketing/features-section";
import { MobileLoginSection } from "@/components/marketing/mobile-login-section";
import { DesktopFeaturesSection } from "@/components/marketing/desktop-features-section";
import { LoginCard } from "@/components/auth/login-card";
import Logo from "@/components/common/logo";
import { useTranslation } from "@/hooks/use-translation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // If already authenticated, skip login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsub();
  }, [router]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Mobile Layout */}
      <div className="block lg:hidden">
        <div className="p-4">
          {/* Header with login buttons */}
          <MobileHeader />

          {/* App Introduction */}
          <AppIntroduction />

          {/* Features Grid */}
          <FeaturesSection className="mb-8" />

          {/* Login Section */}
          <MobileLoginSection />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen flex-col">
        {/* Centered Title and Subtitle */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-2xl">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
              <Logo size={48} className="text-primary" />
              cannafriend
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-200">
              Tu compañero perfecto para el cultivo de plantas. Registra,
              monitorea y optimiza el crecimiento de tus plantas de manera
              profesional.
            </p>
          </div>
        </div>

        {/* Features and Login Form Side by Side */}
        <div className="flex-1 flex justify-center p-8">
          <div className="w-full max-w-6xl flex gap-8">
            {/* Left Side - Features */}
            <div className="flex-1">
              <DesktopFeaturesSection />
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex justify-center items-start">
              {checkingAuth ? (
                <div className="w-full max-w-md border-0 shadow-2xl dark:shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto" />
                  </div>
                </div>
              ) : (
                <LoginCard />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
