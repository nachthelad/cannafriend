"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DesktopFormWorkbenchProps {
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
  sidebarClassName?: string;
  contentClassName?: string;
  sidebarBelowOnMobile?: boolean;
}

interface WorkbenchSurfaceProps {
  children: ReactNode;
  className?: string;
}

export function DesktopFormWorkbench({
  sidebar,
  children,
  className,
  sidebarClassName,
  contentClassName,
  sidebarBelowOnMobile = false,
}: DesktopFormWorkbenchProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 md:px-6 pb-20", className)}
    >
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <aside
          className={cn(
            "space-y-4 xl:sticky xl:top-28 xl:self-start",
            sidebarBelowOnMobile && "order-2 xl:order-none",
            sidebarClassName
          )}
        >
          {sidebar}
        </aside>
        <div
          className={cn(
            "min-w-0 space-y-6",
            sidebarBelowOnMobile && "order-1 xl:order-none",
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function WorkbenchSurface({
  children,
  className,
}: WorkbenchSurfaceProps) {
  return (
    <section
      className={cn(
        "space-y-4 xl:rounded-[28px] xl:border xl:border-border/70 xl:bg-card/80 xl:p-6 xl:shadow-[0_24px_80px_-40px_rgba(0,0,0,0.7)] xl:backdrop-blur-sm",
        className
      )}
    >
      {children}
    </section>
  );
}
