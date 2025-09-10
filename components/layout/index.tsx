"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import {
  Home,
  Settings,
  LogOut,
  Calendar,
  Bell,
  Plus,
  Package,
  Leaf,
  FlaskConical,
} from "lucide-react";
import { useUserRoles } from "@/hooks/use-user-roles";
import { usePremium } from "@/hooks/use-premium";
import { Brain } from "lucide-react";
import Logo from "@/components/common/logo";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ROUTE_AI_ASSISTANT,
  ROUTE_DASHBOARD,
  ROUTE_SESSIONS,
  ROUTE_PLANTS_NEW,
  ROUTE_PLANTS,
  ROUTE_JOURNAL,
  ROUTE_REMINDERS,
  ROUTE_SETTINGS,
  ROUTE_PREMIUM,
  ROUTE_STASH,
  ROUTE_NUTRIENTS,
  resolveHomePathForRoles,
} from "@/lib/routes";
import { CookieConsent } from "@/components/common/cookie-consent";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { t } = useTranslation(["nav", "common", "dashboard", "sessions", "analyzePlant"]);
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { roles, isLoading: rolesLoading } = useUserRoles();
  const homeHref = resolveHomePathForRoles(roles);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Redirect if current path is no longer allowed after roles update (no full reload)
  useEffect(() => {
    if (rolesLoading || !roles) return;
    const isGrowerArea = [
      ROUTE_DASHBOARD,
      ROUTE_PLANTS,
      ROUTE_REMINDERS,
      ROUTE_JOURNAL,
    ].some((p) => pathname?.startsWith(p));
    const isConsumerArea = pathname?.startsWith(ROUTE_SESSIONS);
    if (roles.consumer && !roles.grower && isGrowerArea) {
      router.replace(resolveHomePathForRoles(roles));
    } else if (roles.grower && !roles.consumer && isConsumerArea) {
      router.replace(resolveHomePathForRoles(roles));
    }
  }, [rolesLoading, roles, pathname, router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const baseRoutes = [
    {
      href: ROUTE_DASHBOARD,
      label: t("dashboard", { ns: "nav" }),
      icon: Home,
    },
    {
      href: ROUTE_PLANTS,
      label: t("yourPlants", { ns: "dashboard" }),
      icon: Leaf,
    },
    {
      href: ROUTE_PLANTS_NEW,
      label: t("addPlant", { ns: "nav" }),
      icon: Plus,
    },
    {
      href: ROUTE_SESSIONS,
      label: t("title", { ns: "sessions" }),
      icon: Plus,
    },
    {
      href: ROUTE_STASH,
      label: t("stash.title", { ns: "common" }),
      icon: Package,
    },
    {
      href: ROUTE_NUTRIENTS,
      label: "Nutrientes",
      icon: FlaskConical,
    },
    {
      href: ROUTE_JOURNAL,
      label: t("journal", { ns: "nav" }),
      icon: Calendar,
    },
    {
      href: ROUTE_REMINDERS,
      label: t("reminders", { ns: "dashboard" }),
      icon: Bell,
    },
    {
      href: ROUTE_AI_ASSISTANT,
      label: t("assistant", { ns: "analyzePlant" }),
      icon: Brain,
    },
    {
      href: ROUTE_SETTINGS,
      label: t("settings", { ns: "nav" }),
      icon: Settings,
    },
  ];

  const { isPremium } = usePremium();

  const routes = baseRoutes.filter((r) => {
    if (!roles) return false; // avoid rendering links when roles unknown to prevent hydration mismatch

    const growerPaths: string[] = [
      ROUTE_DASHBOARD,
      ROUTE_PLANTS_NEW,
      ROUTE_REMINDERS,
      ROUTE_JOURNAL,
    ];
    const consumerPaths: string[] = [ROUTE_SESSIONS, ROUTE_STASH]; // sidebar entry for consumer
    const isGrowerRoute =
      growerPaths.includes(r.href) || r.href.startsWith(ROUTE_PLANTS);
    const isConsumerRoute = consumerPaths.includes(r.href);
    if (!roles.grower && isGrowerRoute) return false;
    if (!roles.consumer && isConsumerRoute) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="flex h-14 items-center border-b px-4">
          <Link
            href={homeHref}
            className="flex items-center gap-2 font-semibold"
          >
            <Logo size={20} className="text-primary" />
            <span className="text-xl">{t("app.name", { ns: "common" })}</span>
            {isPremium && (
              <span className="text-xs font-medium text-primary opacity-70 ml-1">
                Premium
              </span>
            )}
          </Link>
        </div>
        <nav className="flex-1 overflow-auto py-4 px-2">
          <div className="space-y-1">
            {rolesLoading ? (
              <>
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </>
            ) : (
              routes.map((route) => {
                const isAI = route.href === ROUTE_AI_ASSISTANT;
                const baseClasses =
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors";
                const active = pathname === route.href;
                const defaultClasses = active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground";
                const gradientClasses =
                  "text-white bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500 hover:from-emerald-600 hover:via-green-700 hover:to-teal-600";
                const linkHref =
                  route.href === ROUTE_AI_ASSISTANT && !isPremium
                    ? ROUTE_PREMIUM
                    : route.href;
                return (
                  <Link
                    key={route.href}
                    href={linkHref}
                    className={cn(
                      baseClasses,
                      isAI ? gradientClasses : defaultClasses
                    )}
                  >
                    <route.icon className="h-4 w-4" />
                    {route.label}
                  </Link>
                );
              })
            )}
          </div>
        </nav>
        <div className="border-t p-4">
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("signOut", { ns: "nav" })}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 pb-41 md:pb-6 md:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
        {/* Mobile bottom navigation */}
        <MobileBottomNav />
      </div>
      {/* Cookie consent banner */}
      <CookieConsent />
    </div>
  );
}
