"use client";

import type React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  Home,
  Calendar,
  Plus,
  Settings,
  Package,
  Brain,
  Leaf,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { triggerHaptic } from "@/lib/haptic";
import {
  ROUTE_SESSIONS,
  ROUTE_DASHBOARD,
  ROUTE_JOURNAL,
  ROUTE_SETTINGS,
  ROUTE_AI_ASSISTANT,
  ROUTE_STASH,
  ROUTE_PLANTS,
} from "@/lib/routes";

export function MobileBottomNav(): React.ReactElement {
  const pathname = usePathname();
  const { t } = useTranslation(["nav", "common", "sessions", "stash", "ai"]);

  const isActive = (path: string): boolean => {
    if (path === ROUTE_DASHBOARD) {
      return pathname === ROUTE_DASHBOARD || pathname === "/";
    }
    return pathname?.startsWith(path) ?? false;
  };

  const handleHapticClick = useCallback(
    (pattern: "light" | "medium" | "heavy" = "light") => {
      triggerHaptic(pattern);
    },
    []
  );

  // All users get access to all navigation items
  const navigationItems = [
    {
      href: ROUTE_DASHBOARD,
      icon: Home,
      label: t("dashboard", { ns: "nav" }),
    },
    {
      href: ROUTE_JOURNAL,
      icon: Calendar,
      label: t("journal", { ns: "nav" }),
    },
    {
      href: ROUTE_AI_ASSISTANT,
      icon: Brain,
      label: t("assistant", { ns: "ai" }),
    },
    {
      href: ROUTE_SETTINGS,
      icon: Settings,
      label: t("settings", { ns: "nav" }),
    },
  ];

  return (
    <nav
      className={
        // fixed bottom bar, only on mobile
        "md:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 transition-transform duration-300 ease-in-out"
      }
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="relative mx-auto grid max-w-7xl items-center px-4 py-3 grid-cols-5">
        <>
          {/* First two navigation items */}
          {navigationItems.slice(0, 2).map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleHapticClick("light")}
                className={cn(
                  "flex min-h-[48px] items-center justify-center rounded-xl transition-all duration-200 active:scale-95",
                  isActive(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                aria-label={item.label}
              >
                <IconComponent className="h-6 w-6" />
              </Link>
            );
          })}

          {/* Center floating add button */}
          <div className="flex items-center justify-center">
            <Link
              href="/plants/new"
              onClick={() => triggerHaptic("medium")}
              className="relative -translate-y-2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 active:scale-95 hover:shadow-xl hover:shadow-primary/30"
              aria-label="Add"
            >
              <Plus className="h-7 w-7" />
              <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity duration-200 hover:opacity-100" />
            </Link>
          </div>

          {/* Last two navigation items */}
          {navigationItems.slice(2, 4).map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleHapticClick("light")}
                className={cn(
                  "flex min-h-[48px] items-center justify-center rounded-xl transition-all duration-200 active:scale-95",
                  isActive(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                aria-label={item.label}
              >
                <IconComponent className="h-6 w-6" />
              </Link>
            );
          })}
        </>
      </div>
    </nav>
  );
}
