"use client";

import { useTranslation } from "react-i18next";

interface AppIntroductionProps {
  className?: string;
}

export function AppIntroduction({ className = "" }: AppIntroductionProps) {
  const { t } = useTranslation(["common"]);

  return (
    <div className={`text-center mb-8 ${className}`}>
      <div className="text-4xl mb-4">🌱</div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {t("app.name")}
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-200 mb-6">
        {t("landing.hero")}
      </p>
    </div>
  );
}
