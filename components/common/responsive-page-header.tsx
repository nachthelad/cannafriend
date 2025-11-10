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
  showDesktopBackButton = false,
  desktopBackLabel,
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
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
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
            {renderBackButton && showDesktopBackButton ? (
              <Button
                variant="ghost"
                size="sm"
                className="hidden gap-2 px-3 py-2 sm:inline-flex sm:flex-shrink-0"
                onClick={onBackClick}
                asChild={Boolean(backHref)}
              >
                {backHref ? (
                  <Link href={backHref} aria-label="Go back">
                    <ArrowLeft className="h-4 w-4" />
                    {desktopBackLabel ? <span>{desktopBackLabel}</span> : null}
                  </Link>
                ) : (
                  <>
                    <ArrowLeft className="h-4 w-4" />
                    {desktopBackLabel ? <span>{desktopBackLabel}</span> : null}
                  </>
                )}
              </Button>
            ) : null}
            <div className="space-y-1 flex-1 min-w-0">
              {/* Title and mobile actions on same line */}
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {title}
                </h1>
                {/* Mobile Actions - show on mobile, same line as title */}
                {mobileActions ? (
                  <div className="flex items-center gap-2 flex-shrink-0 sm:hidden">
                    {mobileActions}
                  </div>
                ) : null}
              </div>
              {description ? (
                <p className="text-sm text-muted-foreground sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {/* Desktop Actions - show only on desktop, aligned with title */}
          {desktopActions ? (
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0 sm:self-start">
              {desktopActions}
            </div>
          ) : null}
        </div>

        {/* Mobile-specific controls stacked below the title */}
        {mobileControls ? (
          <div className="mt-3 flex flex-col gap-3 sm:hidden">
            <div className="space-y-3">{mobileControls}</div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
