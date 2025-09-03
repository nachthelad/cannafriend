"use client";

import type React from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import {
  Home,
  Calendar,
  Plus,
  Settings,
  Package,
  Brain,
  FlaskConical,
  Sprout,
  Leaf,
} from "lucide-react";
import { useUserRoles } from "@/hooks/use-user-roles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { triggerHaptic } from "@/lib/haptic";
import {
  ROUTE_STRAINS,
  ROUTE_DASHBOARD,
  ROUTE_JOURNAL,
  ROUTE_SETTINGS,
  ROUTE_AI_ASSISTANT,
  ROUTE_STASH,
  ROUTE_NUTRIENTS,
} from "@/lib/routes";

export function MobileBottomNav(): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const { roles, isLoading: rolesLoading } = useUserRoles();
  const { t } = useTranslation(["nav", "common", "onboarding"]);
  const [currentViewMode, setCurrentViewMode] = useState<"grower" | "consumer">(
    "grower"
  );

  // Load persisted role selection from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedViewMode = localStorage.getItem("cannafriend-view-mode") as
        | "grower"
        | "consumer"
        | null;
      if (
        savedViewMode &&
        (savedViewMode === "grower" || savedViewMode === "consumer")
      ) {
        setCurrentViewMode(savedViewMode);
      } else if (roles) {
        // Default to grower if user has grower role, otherwise consumer
        const defaultMode = roles.grower ? "grower" : "consumer";
        setCurrentViewMode(defaultMode);
        localStorage.setItem("cannafriend-view-mode", defaultMode);
      }
    }
  }, [roles]);

  const isActive = (path: string): boolean => {
    // Handle home path based on current view mode for dual-role users
    if (path === ROUTE_DASHBOARD) {
      return pathname === ROUTE_DASHBOARD || pathname === "/";
    }
    if (path === ROUTE_STRAINS) {
      return (
        pathname === ROUTE_STRAINS ||
        (pathname === "/" && currentViewMode === "consumer")
      );
    }
    return pathname?.startsWith(path) ?? false;
  };

  const handleHapticClick = useCallback(
    (pattern: "light" | "medium" | "heavy" = "light") => {
      triggerHaptic(pattern);
    },
    []
  );

  const handleRoleSwitch = useCallback(
    (mode: "grower" | "consumer") => {
      triggerHaptic("medium");
      setCurrentViewMode(mode);
      // Persist role selection
      if (typeof window !== "undefined") {
        localStorage.setItem("cannafriend-view-mode", mode);
      }
      // Navigate to appropriate page for the selected role
      if (mode === "grower") {
        router.push(ROUTE_DASHBOARD);
      } else {
        router.push(ROUTE_STRAINS);
      }
    },
    [router]
  );

  const handleFloatingActionClick = useCallback(() => {
    triggerHaptic("medium");
    // Navigate based on current view mode
    if (currentViewMode === "grower") {
      router.push("/plants/new");
    } else {
      router.push("/sessions/new");
    }
  }, [currentViewMode, router]);

  // Determine navigation items based on current view mode for dual-role users
  const getNavigationItems = () => {
    if (!roles) return [];

    if (roles.grower && roles.consumer) {
      // Dual role - show based on current view mode (always 4 items for centered floating button)
      return currentViewMode === "grower"
        ? [
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
          ]
        : [
            {
              href: ROUTE_STRAINS,
              icon: Home,
              label: t("title", { ns: "strains" }),
            },
            {
              href: ROUTE_STASH,
              icon: Package,
              label: t("title", { ns: "stash" }),
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
    } else if (roles.grower) {
      // Grower only (4 items for centered floating button) - always dashboard
      return [
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
    } else {
      // Consumer only (4 items for centered floating button) - always strains
      return [
        {
          href: ROUTE_STRAINS,
          icon: Home,
          label: t("title", { ns: "strains" }),
        },
        {
          href: ROUTE_STASH,
          icon: Package,
          label: t("title", { ns: "stash" }),
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
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <nav
      className={
        // fixed bottom bar, only on mobile
        "md:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 transition-transform duration-300 ease-in-out"
      }
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      {/* Role switching UI for dual-role users */}
      {roles && roles.grower && roles.consumer && (
        <div className="flex items-center justify-center py-1 px-4 border-b border-border/40">
          <div className="flex items-center space-x-2 bg-muted/50 rounded-full p-1">
            <button
              onClick={() => handleRoleSwitch("grower")}
              className={cn(
                "flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 min-h-[32px]",
                currentViewMode === "grower"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Grower mode"
            >
              <Sprout className="h-3 w-3 mr-1.5" />
              {t("grower", { ns: "onboarding" })}
            </button>
            <button
              onClick={() => handleRoleSwitch("consumer")}
              className={cn(
                "flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 min-h-[32px]",
                currentViewMode === "consumer"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Consumer mode"
            >
              <Leaf className="h-3 w-3 mr-1.5" />
              {t("consumer", { ns: "onboarding" })}
            </button>
          </div>
        </div>
      )}

      <div className="relative mx-auto grid max-w-7xl items-center px-4 py-3 grid-cols-5">
        {rolesLoading || !roles ? (
          <>
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </>
        ) : (
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
              <button
                type="button"
                onClick={handleFloatingActionClick}
                className="relative -translate-y-2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 active:scale-95 hover:shadow-xl hover:shadow-primary/30"
                aria-label="Add"
              >
                <Plus className="h-7 w-7" />
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity duration-200 hover:opacity-100" />
              </button>
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
        )}
      </div>
    </nav>
  );
}
