"use client";

import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { ROUTE_AI_ASSISTANT } from "@/lib/routes";
import { ProductDesktopSidebar } from "@/features/shared/surfaces/product/product-desktop-sidebar";

type ProductShellProps = {
  children: React.ReactNode;
};

const productShellThemeStyle = {
  "--dashboard-bg": "#050806",
  "--dashboard-panel": "#0b100d",
  "--dashboard-panel-2": "#101713",
  "--dashboard-border": "rgba(255,255,255,0.08)",
  "--dashboard-muted": "rgba(214,223,218,0.72)",
  "--dashboard-green": "#45d156",
  "--dashboard-green-soft": "rgba(69,209,86,0.14)",
  "--dashboard-cyan": "#66d9ff",
  "--dashboard-amber": "#f2b429",
} as CSSProperties;

export function ProductShell({ children }: ProductShellProps) {
  const pathname = usePathname();
  const isImmersiveRoute = pathname === ROUTE_AI_ASSISTANT;

  return (
    <div
      className="flex h-screen overflow-hidden bg-background md:bg-[var(--dashboard-bg)]"
      style={productShellThemeStyle}
    >
      {!isImmersiveRoute ? <ProductDesktopSidebar /> : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main
          id="main-content"
          className={
            isImmersiveRoute
              ? "flex-1 overflow-hidden"
              : "flex-1 overflow-auto p-4 pb-32 md:bg-[var(--dashboard-bg)] md:p-4 md:pb-4"
          }
        >
          <div className={isImmersiveRoute ? "h-full" : "min-h-full"}>
            {children}
          </div>
        </main>
        {!isImmersiveRoute ? <MobileBottomNav /> : null}
      </div>
    </div>
  );
}
