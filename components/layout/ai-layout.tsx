"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings, Brain, Menu } from "lucide-react";
import { ROUTE_DASHBOARD } from "@/lib/routes";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";

interface AILayoutProps {
  children: React.ReactNode;
  onToggleSidebar?: () => void;
}

export function AILayout({ children, onToggleSidebar }: AILayoutProps) {
  const { t } = useTranslation(["nav", "common", "analyzePlant"]);
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
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center p-4 border-b bg-background/95 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="mr-3"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">{t("assistant", { ns: "analyzePlant" })}</span>
        </div>
      </div>

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
            {t("back", { ns: "common" })}
          </Button>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">{t("assistant", { ns: "analyzePlant" })}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/settings")}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {t("settings.title", { ns: "common" })}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            {t("signOut", { ns: "nav" })}
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
