"use client";

import type React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Calendar,
  Plus,
  Settings,
  Package,
  Brain,
  FlaskConical,
} from "lucide-react";
import { useUserRoles } from "@/hooks/use-user-roles";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { roles, isLoading: rolesLoading } = useUserRoles();
  const { t } = useTranslation();
  const [chooserOpen, setChooserOpen] = useState(false);
  // no home chooser; home goes directly

  const isActive = (path: string): boolean => {
    if (path === ROUTE_DASHBOARD)
      return pathname === ROUTE_DASHBOARD || pathname === "/";
    return pathname?.startsWith(path) ?? false;
  };

  return (
    <nav
      className={
        // fixed bottom bar, only on mobile
        "md:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      }
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div
        className={cn(
          "relative mx-auto grid max-w-7xl items-center px-4 py-2 grid-cols-5"
        )}
      >
        {rolesLoading || !roles ? (
          <>
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            {!roles || roles.grower ? <Skeleton className="h-12" /> : null}
            <Skeleton className="h-12" />
          </>
        ) : (
          <>
            {/* Home */}
            {roles.consumer && !roles.grower ? (
              <Link
                href={ROUTE_STRAINS}
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs",
                  isActive(ROUTE_STRAINS)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Home"
              >
                <Home className="h-5 w-5" />
              </Link>
            ) : roles.grower && roles.consumer ? (
              <Link
                href={ROUTE_DASHBOARD}
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs",
                  isActive(ROUTE_DASHBOARD)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Home"
              >
                <Home className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                href={ROUTE_DASHBOARD}
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs",
                  isActive(ROUTE_DASHBOARD)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Home"
              >
                <Home className="h-5 w-5" />
              </Link>
            )}

            {/* Slot 2: consumer-only = Stash, grower = Journal */}
            {roles.consumer && !roles.grower ? (
              <Link
                href={ROUTE_STASH}
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs",
                  isActive(ROUTE_STASH)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Stash"
              >
                <Package className="h-5 w-5" />
              </Link>
            ) : roles.grower ? (
              <Link
                href={ROUTE_JOURNAL}
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs",
                  isActive(ROUTE_JOURNAL)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Journal"
              >
                <Calendar className="h-5 w-5" />
              </Link>
            ) : null}

            {/* Center Add button: new plant if grower, new session if consumer-only */}
            <div className="flex items-center justify-center">
              {roles.grower && roles.consumer ? (
                <button
                  type="button"
                  onClick={() => setChooserOpen(true)}
                  className="-translate-y-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
                  aria-label="Add"
                >
                  <Plus className="h-7 w-7" />
                </button>
              ) : (
                <Link
                  href={roles.grower ? "/plants/new" : "/sessions/new"}
                  className="-translate-y-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
                  aria-label="Add"
                >
                  <Plus className="h-7 w-7" />
                </Link>
              )}
            </div>

            {/* Slot 4: All users = AI Assistant */}
            <Link
              href={ROUTE_AI_ASSISTANT}
              className={cn(
                "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs",
                isActive(ROUTE_AI_ASSISTANT)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={t("ai.assistant")}
            >
              <Brain className="h-5 w-5" />
            </Link>

            {/* Settings */}
            <Link
              href={ROUTE_SETTINGS}
              className={cn(
                "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs",
                isActive(ROUTE_SETTINGS)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </>
        )}
      </div>
      {/* Chooser Modal for both roles */}
      <Dialog open={chooserOpen} onOpenChange={setChooserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addChooser.title")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Button
              asChild
              className="w-full"
              onClick={() => setChooserOpen(false)}
            >
              <Link href="/plants/new">{t("addChooser.plant")}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full"
              onClick={() => setChooserOpen(false)}
            >
              <Link href="/sessions/new">{t("addChooser.session")}</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* no home chooser */}
    </nav>
  );
}
