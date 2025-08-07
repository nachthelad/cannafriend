"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-translation";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";
import { GoogleLoginButton } from "./google-login-button";

interface AuthTabsProps {
  className?: string;
}

export function AuthTabs({ className = "" }: AuthTabsProps) {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="login" className={`w-full ${className}`}>
      <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100 dark:bg-gray-700">
        <TabsTrigger
          value="login"
          className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-gray-700 dark:text-gray-200"
        >
          {t("login.title")}
        </TabsTrigger>
        <TabsTrigger
          value="signup"
          className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-gray-700 dark:text-gray-200"
        >
          {t("signup.title")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <LoginForm />
      </TabsContent>

      <TabsContent value="signup">
        <SignupForm />
      </TabsContent>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white/95 dark:bg-gray-800/95 px-2 text-gray-500 dark:text-gray-400">
            {t("login.or")}
          </span>
        </div>
      </div>

      <GoogleLoginButton />
    </Tabs>
  );
}
