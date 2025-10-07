"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResponsivePageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /**
   * URL to navigate when the back button is pressed. If omitted, no back button is rendered.
   */
  backHref?: string;
  /**
   * Optional click handler for cases where navigation is handled imperatively.
   */
  onBackClick?: () => void;
  /**
   * Extra class names applied to the outer header element.
   */
  className?: string;
  /**
   * Content rendered below the title/description block on mobile viewports. Useful for search bars or filters.
   */
  mobileControls?: ReactNode;
  /**
   * Content rendered to the right of the title on mobile viewports. Typically icon-only action buttons.
   */
  mobileActions?: ReactNode;
  /**
   * Content rendered to the right of the title on desktop viewports. Typically action buttons or filters.
   */
  desktopActions?: ReactNode;
  /**
   * Whether the header should stick to the top of the viewport. Enabled by default for mobile parity.
   */
  sticky?: boolean;
  /**
   * Controls whether the mobile back button is rendered when a back action is provided.
   */
  showMobileBackButton?: boolean;
}

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
