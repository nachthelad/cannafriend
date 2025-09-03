"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, PlayCircle, Smartphone, Leaf, Shield, Zap } from "lucide-react";

interface CTASectionProps {
  onLoginClick: () => void;
  deferredPrompt: any;
  onInstallPWA: () => void;
  isLoggedIn: boolean;
}

export function CTASection({
  onLoginClick,
  deferredPrompt,
  onInstallPWA,
  isLoggedIn,
}: CTASectionProps) {
  const { t } = useTranslation(["common"]);

  return (
    <section className="py-20 bg-gradient-to-br from-green-600 to-blue-600 dark:from-green-800 dark:to-blue-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center text-white mb-16">
          <h2 className="text-4xl font-bold mb-6">
            {t("cta.title")}
          </h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto mb-12">
            {t("cta.description")}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              onClick={onLoginClick}
              size="lg"
              className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            >
              <PlayCircle className="mr-2 h-6 w-6" />
              {isLoggedIn ? t("nav.goToApp") : t("cta.startFreeNow")}
            </Button>

            {deferredPrompt && (
              <Button
                onClick={onInstallPWA}
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 text-lg font-semibold"
              >
                <Download className="mr-2 h-6 w-6" />
                {t("cta.installApp")}
              </Button>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <Leaf className="h-12 w-12 mx-auto mb-4 text-green-200" />
              <h3 className="text-xl font-semibold mb-2">{t("cta.completelyFree")}</h3>
              <p className="opacity-90">
                {t("cta.completelyFreeDesc")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-blue-200" />
              <h3 className="text-xl font-semibold mb-2">{t("cta.totalPrivacy")}</h3>
              <p className="opacity-90">
                {t("cta.totalPrivacyDesc")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-yellow-200" />
              <h3 className="text-xl font-semibold mb-2">{t("cta.instantAccess")}</h3>
              <p className="opacity-90">
                {t("cta.instantAccessDesc")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mobile App Highlight */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-8 text-center text-white">
          <Smartphone className="h-16 w-16 mx-auto mb-6 text-green-200" />
          <h3 className="text-2xl font-bold mb-4">
            {t("cta.mobileTitle")}
          </h3>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-6">
            {t("cta.mobileDesc")}
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="px-3 py-1 bg-white/20 rounded-full">
              {t("cta.installAsApp")}
            </span>
            <span className="px-3 py-1 bg-white/20 rounded-full">
              {t("cta.worksOffline")}
            </span>
            <span className="px-3 py-1 bg-white/20 rounded-full">
              {t("cta.loadsInstantly")}
            </span>
            <span className="px-3 py-1 bg-white/20 rounded-full">
              {t("cta.pushNotifications")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}