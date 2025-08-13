"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { GoogleLoginButton } from "@/components/auth/google-login-button";

interface MobileHeaderProps {
  className?: string;
  isLoggedIn?: boolean;
  onPrimaryClick?: () => void;
}

export function MobileHeader({
  className = "",
  isLoggedIn = false,
  onPrimaryClick,
}: MobileHeaderProps) {
  const { t } = useTranslation();

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
