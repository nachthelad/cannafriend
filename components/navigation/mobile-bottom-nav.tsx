"use client";

import type React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Calendar, Plus, Settings, Bell } from "lucide-react";
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

export function MobileBottomNav(): React.ReactElement {
  const pathname = usePathname();
  const { roles, isLoading: rolesLoading } = useUserRoles();
  const { t } = useTranslation();
  const [chooserOpen, setChooserOpen] = useState(false);
  // no home chooser; home goes directly

  const isActive = (path: string): boolean => {
    if (path === "/dashboard")
      return pathname === "/dashboard" || pathname === "/";
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
          "relative mx-auto grid max-w-7xl items-center px-4 py-2",
          roles && roles.consumer && !roles.grower
            ? "grid-cols-3"
            : "grid-cols-5"
        )}
      >
        {rolesLoading || !roles ? null : (
          <>
            {/* Home */}
            {roles.consumer && !roles.grower ? (
              <Link
                href="/strains"
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs",
                  isActive("/strains")
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Home"
              >
                <Home className="h-5 w-5" />
              </Link>
            ) : roles.grower && roles.consumer ? (
              <Link
                href="/dashboard"
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs",
                  isActive("/dashboard")
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Home"
              >
                <Home className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs",
                  isActive("/dashboard")
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Home"
              >
                <Home className="h-5 w-5" />
              </Link>
            )}

            {/* Journal: hide for consumer-only */}
            {roles.grower && (
              <Link
                href="/journal"
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs",
                  isActive("/journal")
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Journal"
              >
                <Calendar className="h-5 w-5" />
              </Link>
            )}

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

            {/* Reminders (hide if consumer-only) */}
            {roles.grower && (
              <Link
                href="/reminders"
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs",
                  isActive("/reminders")
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Reminders"
              >
                <Bell className="h-5 w-5" />
              </Link>
            )}

            {/* Settings */}
            <Link
              href="/settings"
              className={cn(
                "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs",
                isActive("/settings")
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
