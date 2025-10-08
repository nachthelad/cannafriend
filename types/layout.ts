import type { ReactNode } from "react";

export interface LayoutProps {
  children: ReactNode;
}

export interface AILayoutProps {
  children: ReactNode;
  onToggleSidebar?: () => void;
}
