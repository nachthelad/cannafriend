"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Download, PlayCircle, Leaf, Camera, Brain } from "lucide-react";
import Logo from "@/components/common/logo";

interface HeroSectionProps {
  onLoginClick: () => void;
  deferredPrompt: any;
  onInstallPWA: () => void;
  isLoggedIn: boolean;
}

export function HeroSection({
  onLoginClick,
  deferredPrompt,
  onInstallPWA,
  isLoggedIn,
}: HeroSectionProps) {
  const { t } = useTranslation(["common"]);

  return (
    <section className="relative py-20 px-6">
      <div className="max-w-7xl mx-auto text-center">
        {/* Logo and Title */}
        <div className="mb-8">
          <Logo size={72} className="text-primary mx-auto mb-6" />
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
            {t("app.name")}
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 mb-4 max-w-3xl mx-auto">
            {t("hero.subtitle")}
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            {t("hero.description")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            onClick={onLoginClick}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-black px-8 py-4 text-lg"
          >
            <PlayCircle className="mr-2 h-6 w-6" />
            {isLoggedIn ? t("nav.goToApp") : t("hero.startFree")}
          </Button>

          {deferredPrompt && (
            <Button
              onClick={onInstallPWA}
              size="lg"
              variant="outline"
              className="px-8 py-4 text-lg border-2"
            >
              <Download className="mr-2 h-6 w-6" />
              {t("app.installPWA")}
            </Button>
          )}
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t("hero.professionalGrowing")}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t("hero.professionalGrowingDesc")}
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t("hero.documentEverything")}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t("hero.documentEverythingDesc")}
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t("hero.aiComingSoon")}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t("hero.aiComingSoonDesc")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}