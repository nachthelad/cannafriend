"use client";

import { useTranslation } from "@/hooks/use-translation";
import { AuthTabs } from "@/components/auth/auth-tabs";

interface MobileLoginSectionProps {
  className?: string;
}

export function MobileLoginSection({
  className = "",
}: MobileLoginSectionProps) {
  const { t } = useTranslation();

  return (
    <div
      id="login-section"
      className={`bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm ${className}`}
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold text-center mb-4 text-gray-900 dark:text-white">
          {t("login.title")}
        </h2>
        <AuthTabs />
      </div>
    </div>
  );
}
