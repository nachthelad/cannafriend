import type { ReactNode } from "react";
import { MarketingSurfaceLayout } from "@/features/shared/surfaces/marketing/marketing-surface-layout";

export default function MarketingGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <MarketingSurfaceLayout>{children}</MarketingSurfaceLayout>;
}
