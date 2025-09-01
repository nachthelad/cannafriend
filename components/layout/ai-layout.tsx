"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";
import { ROUTE_DASHBOARD } from "@/lib/routes";
import Logo from "@/components/common/logo";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";

interface AILayoutProps {
  children: React.ReactNode;
}

export function AILayout({ children }: AILayoutProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* No mobile top bar - use bottom navigation instead */}

      {/* Top Bar - Desktop */}
      <div className="hidden md:flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(ROUTE_DASHBOARD)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
          <div className="w-px h-6 bg-border" />
          <Logo className="h-6" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/settings")}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {t("settings.title")}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            {t("auth.signOut")}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden pb-32 md:pb-0">{children}</div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
