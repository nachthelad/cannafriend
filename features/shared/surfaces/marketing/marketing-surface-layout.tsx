import type { ReactNode } from "react";

type MarketingSurfaceLayoutProps = {
  children: ReactNode;
};

export function MarketingSurfaceLayout({
  children,
}: MarketingSurfaceLayoutProps) {
  return <>{children}</>;
}
