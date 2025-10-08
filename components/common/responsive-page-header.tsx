"use client";

import type { ResponsivePageHeaderProps } from "@/types/common";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ResponsivePageHeader({
  title,
  description,
  backHref,
  onBackClick,
  className,
  mobileControls,
  mobileActions,
  desktopActions,
  sticky = true,
  showMobileBackButton = true,
}: ResponsivePageHeaderProps) {
  const renderBackButton = backHref || onBackClick;

  return (
    <header
      className={cn(
        "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 mb-2",
        sticky && "sticky top-0 z-20",
        className
      )}
    >
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {renderBackButton && showMobileBackButton ? (
              <Button
                variant="ghost"
                size="icon"
                className="mt-1 flex-shrink-0 sm:hidden"
                onClick={onBackClick}
                asChild={Boolean(backHref)}
              >
                {backHref ? (
                  <Link href={backHref} aria-label="Go back">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                ) : (
                  <ArrowLeft className="h-5 w-5" />
                )}
              </Button>
            ) : null}
            <div className="space-y-1 flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {title}
              </h1>
              {description ? (
                <p className="text-sm text-muted-foreground sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
            {mobileControls ? (
              <div className="space-y-3 sm:hidden">{mobileControls}</div>
            ) : null}
          </div>

          {/* Mobile Actions - show only on mobile */}
          {mobileActions ? (
            <div className="flex items-start gap-2 mt-1 sm:hidden flex-shrink-0">
              {mobileActions}
            </div>
          ) : null}

          {/* Desktop Actions - show only on desktop */}
          {desktopActions ? (
            <div className="hidden sm:flex items-center gap-2 mt-1 flex-shrink-0">
              {desktopActions}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
