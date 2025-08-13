"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { cn } from "@/lib/utils";
import {
  Home,
  Settings,
  LogOut,
  Calendar,
  Bell,
  Plus,
  Package,
} from "lucide-react";
import { useUserRoles } from "@/hooks/use-user-roles";
import { usePremium } from "@/hooks/use-premium";
import { Brain } from "lucide-react";
import Logo from "@/components/common/logo";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { Skeleton } from "@/components/ui/skeleton";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { roles, isLoading: rolesLoading } = useUserRoles();
  const homeHref =
    roles && roles.consumer && !roles.grower ? "/strains" : "/dashboard";

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Redirect if current path is no longer allowed after roles update (no full reload)
  useEffect(() => {
    if (rolesLoading || !roles) return;
    const isGrowerArea = [
      "/dashboard",
      "/plants",
      "/reminders",
      "/journal",
    ].some((p) => pathname?.startsWith(p));
    const isConsumerArea = pathname?.startsWith("/strains");
    if (roles.consumer && !roles.grower && isGrowerArea) {
      router.replace("/strains");
    } else if (roles.grower && !roles.consumer && isConsumerArea) {
      router.replace("/dashboard");
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
      href: "/dashboard",
      label: t("nav.dashboard"),
      icon: Home,
    },
    {
      href: "/plants/new",
      label: t("nav.addPlant"),
      icon: Plus,
    },
    {
      href: "/strains",
      label: t("strains.title"),
      icon: Plus,
    },
    {
      href: "/stash",
      label: t("stash.title"),
      icon: Package,
    },
    {
      href: "/journal",
      label: t("nav.journal"),
      icon: Calendar,
    },
    {
      href: "/reminders",
      label: t("dashboard.reminders"),
      icon: Bell,
    },
    {
      href: "/settings",
      label: t("nav.settings"),
      icon: Settings,
    },
  ];

  const { isPremium } = usePremium();

  // Insert Analyze with AI above Settings for premium users
  const withAnalyze = (() => {
    const arr = baseRoutes.slice();
    if (isPremium) {
      const insertIdx = arr.findIndex((r) => r.href === "/settings");
      const idx = insertIdx >= 0 ? insertIdx : arr.length;
      arr.splice(idx, 0, {
        href: "/analyze-plant",
        label: t("analyzePlant.title"),
        icon: Brain,
      } as any);
    }
    return arr;
  })();

  const routes = withAnalyze.filter((r) => {
    if (!roles) return false; // avoid rendering links when roles unknown to prevent hydration mismatch
    const growerPaths = ["/dashboard", "/plants/new", "/reminders", "/journal"];
    const consumerPaths = ["/strains", "/stash"]; // sidebar entry for consumer
    const isGrowerRoute =
      growerPaths.includes(r.href) || r.href.startsWith("/plants");
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
            <span className="text-xl">{t("app.name")}</span>
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
                const isAnalyze = route.href === "/analyze-plant";
                const baseClasses =
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors";
                const active = pathname === route.href;
                const defaultClasses = active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground";
                const gradientClasses =
                  "text-white bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500 hover:from-emerald-600 hover:via-green-700 hover:to-teal-600";
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      baseClasses,
                      isAnalyze ? gradientClasses : defaultClasses
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
            {t("nav.signOut")}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header (no sidebar) */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <Link
            href={homeHref}
            className="flex items-center gap-2 font-semibold"
          >
            <Logo size={20} className="text-primary" />
            <span className="text-xl">{t("app.name")}</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 pb-24 md:pb-6 md:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
        {/* Mobile bottom navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
