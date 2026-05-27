"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

import ThemeLogo from "@/components/common/theme-logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePremium } from "@/hooks";
import { signOutEverywhere } from "@/lib/auth-session";
import {
  ROUTE_AI_ASSISTANT,
  ROUTE_DASHBOARD,
  ROUTE_LOGIN,
  ROUTE_PREMIUM,
} from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  getProductNavItems,
  isProductNavItemActive,
} from "@/features/shared/navigation/product-nav";
import {
  productNavItemActiveClass,
  productNavItemBaseClass,
  productNavItemIdleClass,
} from "@/features/shared/surfaces/product/product-nav-item-styles";

export function ProductDesktopSidebar() {
  const { t } = useTranslation([
    "nav",
    "common",
    "dashboard",
    "aiAssistant",
  ]);
  const pathname = usePathname();
  const router = useRouter();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { isPremium } = usePremium();
  const routes = useMemo(() => getProductNavItems(t), [t]);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOutEverywhere();
      router.replace(ROUTE_LOGIN);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <aside className="hidden h-full w-64 flex-col border-r border-white/6 bg-[linear-gradient(180deg,rgba(4,8,6,0.98),rgba(4,8,6,0.88))] px-3 py-6 md:flex">
      <div className="flex h-full flex-col">
        <Link
          href={ROUTE_DASHBOARD}
          className="mb-6 flex items-center gap-2.5 px-2"
        >
          <ThemeLogo size={32} />
          <span className="text-[1.6rem] font-semibold tracking-[-0.04em] text-white">
            {t("app.name", { ns: "common" })}
          </span>
          {isPremium ? (
            <span className="rounded-full bg-[rgba(69,209,86,0.14)] px-2.5 py-1 text-[0.7rem] font-medium text-[#45d156]">
              Premium
            </span>
          ) : null}
        </Link>

        <nav className="space-y-1.5">
          {!hasHydrated ? (
            <>
              <Skeleton className="h-10 w-full rounded-2xl bg-white/8" />
              <Skeleton className="h-10 w-full rounded-2xl bg-white/8" />
              <Skeleton className="h-10 w-full rounded-2xl bg-white/8" />
              <Skeleton className="h-10 w-full rounded-2xl bg-white/8" />
            </>
          ) : (
            routes.map((route) => {
              const isActive = isProductNavItemActive(pathname, route.href);
              const href =
                route.href === ROUTE_AI_ASSISTANT && !isPremium
                  ? ROUTE_PREMIUM
                  : route.href;

              return (
                <Link
                  key={route.href}
                  href={href}
                  className={cn(
                    productNavItemBaseClass,
                    isActive
                      ? productNavItemActiveClass
                      : productNavItemIdleClass,
                  )}
                >
                  <span className="flex items-center gap-3">
                    <route.icon
                      className={cn(
                        "h-[18px] w-[18px]",
                        isActive ? "text-[#45d156]" : "text-white/78",
                      )}
                    />
                    {route.label}
                  </span>
                  {route.href === ROUTE_AI_ASSISTANT ? (
                    <span className="rounded-full bg-[rgba(69,209,86,0.14)] px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[#45d156]">
                      {t("newBadge", { ns: "dashboard" })}
                    </span>
                  ) : null}
                </Link>
              );
            })
          )}
        </nav>

        <div className="mt-auto pt-6">
          <Button
            type="button"
            variant="ghost"
            className="h-[52px] w-full justify-start rounded-[18px] border border-white/8 bg-transparent px-3.5 text-base text-white hover:bg-white/[0.03]"
            onClick={handleSignOut}
            loading={isSigningOut}
          >
            <LogOut className="h-[18px] w-[18px] text-[#f86f55]" />
            {t("signOut", { ns: "nav" })}
          </Button>
        </div>
      </div>
    </aside>
  );
}
