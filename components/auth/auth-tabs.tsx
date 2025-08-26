"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-translation";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";
import { GoogleLoginButton } from "./google-login-button";

interface AuthTabsProps {
  className?: string;
  onLoginSuccess?: () => void;
}

export function AuthTabs({ className = "", onLoginSuccess }: AuthTabsProps) {
  const { t } = useTranslation();

  return (
    <div className={`w-full ${className}`}>
      <div className="space-y-4 mb-4">
        <GoogleLoginButton onSuccess={onLoginSuccess} />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/95 dark:bg-gray-900/95 px-2 text-gray-500 dark:text-gray-400 rounded">
              {t("login.or")}
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="login">{t("login.title")}</TabsTrigger>
          <TabsTrigger value="signup">{t("signup.title")}</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <LoginForm onSuccess={onLoginSuccess} />
        </TabsContent>

        <TabsContent value="signup">
          <SignupForm onSuccess={onLoginSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
