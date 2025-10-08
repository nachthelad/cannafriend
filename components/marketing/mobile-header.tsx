"use client";

import type { MobileHeaderProps } from "@/types/marketing";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { GoogleLoginButton } from "@/components/auth/google-login-button";

export function MobileHeader({
  className = "",
  isLoggedIn = false,
  onPrimaryClick,
}: MobileHeaderProps) {
  const { t } = useTranslation(["common"]);

  return (
    <div className={`flex justify-between items-center mb-8 ${className}`}>
      <Button
        variant="outline"
        onClick={() => {
          if (onPrimaryClick) {
            onPrimaryClick();
          } else {
            document
              .getElementById("login-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }
        }}
        className="flex-1 mr-2 bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
      >
        {isLoggedIn ? (t("nav.goToApp") as any) : t("login.title")}
      </Button>
      {!isLoggedIn && (
        <GoogleLoginButton
          variant="outline"
          className="flex-shrink-0"
          size="icon"
        />
      )}
    </div>
  );
}
