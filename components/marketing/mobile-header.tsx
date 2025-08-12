"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { GoogleLoginButton } from "@/components/auth/google-login-button";

interface MobileHeaderProps {
  className?: string;
  onLoginClick?: () => void;
}

export function MobileHeader({
  className = "",
  onLoginClick,
}: MobileHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className={`flex justify-between items-center mb-8 ${className}`}>
      <Button
        variant="outline"
        onClick={() => {
          if (onLoginClick) {
            onLoginClick();
          } else {
            document
              .getElementById("login-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }
        }}
        className="flex-1 mr-2 bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
      >
        {t("login.title")}
      </Button>
      <GoogleLoginButton
        variant="outline"
        className="flex-shrink-0"
        size="icon"
      />
    </div>
  );
}
