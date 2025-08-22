"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/auth/login-modal";
import { HeroSection } from "@/components/marketing/hero-section";
import { AppShowcase } from "@/components/marketing/app-showcase";
import { CTASection } from "@/components/marketing/cta-section";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { ThemeToggle } from "@/components/common/theme-toggle";
import Logo from "@/components/common/logo";

interface DesktopLandingViewProps {
  isLoggedIn: boolean;
  loginOpen: boolean;
  onLoginOpenChange: (open: boolean) => void;
  onLoginClick: () => void;
  deferredPrompt: any;
  onInstallPWA: () => void;
}

export function DesktopLandingView({
  isLoggedIn,
  loginOpen,
  onLoginOpenChange,
  onLoginClick,
  deferredPrompt,
  onInstallPWA,
}: DesktopLandingViewProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Logo size={32} className="text-primary" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {t("app.name")}
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <a 
                href="#features" 
                className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
              >
                {t("nav.features")}
              </a>
              <a 
                href="#showcase" 
                className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
              >
                {t("nav.functions")}
              </a>
              <button
                onClick={() => {
                  const element = document.querySelector('[data-section="ai"]');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors cursor-pointer"
              >
                {t("nav.ai")}
              </button>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <ThemeToggle />
              <Button onClick={onLoginClick} className="font-semibold">
                {isLoggedIn ? t("nav.goToApp") : t("login.title")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onLoginClick={onLoginClick}
          deferredPrompt={deferredPrompt}
          onInstallPWA={onInstallPWA}
          isLoggedIn={isLoggedIn}
        />

        {/* App Showcase */}
        <div id="showcase">
          <AppShowcase />
        </div>

        {/* Stats Section */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <div className="text-gray-600 dark:text-gray-300">{t("stats.free")}</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">📱</div>
                <div className="text-gray-600 dark:text-gray-300">{t("stats.mobileApp")}</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">🧠</div>
                <div className="text-gray-600 dark:text-gray-300">{t("stats.aiComingSoon")}</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">🔄</div>
                <div className="text-gray-600 dark:text-gray-300">{t("stats.worksOffline")}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose CannaFriend */}
        <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                {t("landing.whyChoose")}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {t("landing.whyChooseDesc")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌱</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t("benefits.cannabisSpecific")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t("benefits.cannabisSpecificDesc")}
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t("benefits.easyToUse")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t("benefits.easyToUseDesc")}
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔄</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t("benefits.alwaysAvailable")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t("benefits.alwaysAvailableDesc")}
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t("benefits.completelyPrivate")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t("benefits.completelyPrivateDesc")}
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t("benefits.continuousImprovement")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t("benefits.continuousImprovementDesc")}
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t("benefits.betterResults")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t("benefits.betterResultsDesc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <CTASection
          onLoginClick={onLoginClick}
          deferredPrompt={deferredPrompt}
          onInstallPWA={onInstallPWA}
          isLoggedIn={isLoggedIn}
        />
      </main>

      {/* Footer */}
      <LandingFooter />

      {/* Login Modal */}
      <LoginModal open={loginOpen} onOpenChange={onLoginOpenChange} />
    </div>
  );
}