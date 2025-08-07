"use client";

import { MobileHeader } from "@/components/mobile-header";
import { AppIntroduction } from "@/components/app-introduction";
import { FeaturesSection } from "@/components/features-section";
import { MobileLoginSection } from "@/components/mobile-login-section";
import { DesktopFeaturesSection } from "@/components/desktop-features-section";
import { LoginCard } from "@/components/login-card";

export default function LoginPage() {
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
            <div className="text-6xl mb-6">🌱</div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
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
              <LoginCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
