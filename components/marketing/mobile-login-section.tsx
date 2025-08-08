"use client";

import { useTranslation } from "@/hooks/use-translation";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface MobileLoginSectionProps {
  className?: string;
}

export function MobileLoginSection({
  className = "",
}: MobileLoginSectionProps) {
  const { t } = useTranslation();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) return; // parent will redirect; keep skeleton here meanwhile
      setCheckingAuth(false);
    });
    return () => unsub();
  }, []);

  return (
    <div
      id="login-section"
      className={`bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm ${className}`}
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold text-center mb-4 text-gray-900 dark:text-white">
          {t("login.title")}
        </h2>
        {checkingAuth ? (
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto" />
          </div>
        ) : (
          <AuthTabs />
        )}
      </div>
    </div>
  );
}
