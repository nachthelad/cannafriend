"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import ThemeLogo from "@/components/common/theme-logo";
import { usePremium } from "@/hooks";
import { auth } from "@/lib/firebase";
import {
  ROUTE_AI_ASSISTANT,
  ROUTE_DASHBOARD,
  ROUTE_LOGIN,
  ROUTE_PREMIUM,
} from "@/lib/routes";
import { cn } from "@/lib/utils";
import { getProductNavItems } from "@/features/shared/navigation/product-nav";

type ProductShellProps = {
  children: React.ReactNode;
};

export function ProductShell({ children }: ProductShellProps) {
  const { t } = useTranslation([
    "nav",
    "common",
    "dashboard",
    "sessions",
    "aiAssistant",
  ]);
  const pathname = usePathname();
  const router = useRouter();
  const [hasHydrated, setHasHydrated] = useState(false);
  const { isPremium } = usePremium();
  const routes = getProductNavItems(t);
  const isImmersiveRoute = pathname === ROUTE_AI_ASSISTANT;

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace(ROUTE_LOGIN);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden h-full w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link
            href={ROUTE_DASHBOARD}
            className="flex items-center gap-2 font-semibold"
          >
            <ThemeLogo size={28} />
            <span className="text-xl">{t("app.name", { ns: "common" })}</span>
            {isPremium ? (
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Premium
              </span>
            ) : null}
          </Link>
        </div>

        <nav className="flex-1 overflow-auto px-2 py-4">
          <div className="space-y-1">
            {!hasHydrated ? (
              <>
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </>
            ) : (
              routes.map((route) => {
                const isAI = route.href === ROUTE_AI_ASSISTANT;
                const active = pathname === route.href;
                const baseClasses =
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors";
                const defaultClasses = active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground";
                const gradientClasses =
                  "bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500 text-white hover:from-emerald-600 hover:via-green-700 hover:to-teal-600";
                const href =
                  route.href === ROUTE_AI_ASSISTANT && !isPremium
                    ? ROUTE_PREMIUM
                    : route.href;

                return (
                  <Link
                    key={route.href}
                    href={href}
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

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main
          id="main-content"
          className={
            isImmersiveRoute
              ? "flex-1 overflow-hidden"
              : "flex-1 overflow-auto p-4 pb-32 md:p-6 md:pb-6"
          }
        >
          <div className={isImmersiveRoute ? "h-full" : "mx-auto"}>
            {children}
          </div>
        </main>
        {!isImmersiveRoute ? <MobileBottomNav /> : null}
      </div>
    </div>
  );
}
