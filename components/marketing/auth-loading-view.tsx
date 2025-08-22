"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Loader2 } from "lucide-react";

export function AuthLoadingView() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-sm text-muted-foreground">
          {t("auth.checking")}
        </p>
      </div>
    </div>
  );
}