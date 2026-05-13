import {
  Brain,
  Calendar,
  Bell,
  Home,
  Leaf,
  Settings,
} from "lucide-react";
import {
  ROUTE_AI_ASSISTANT,
  ROUTE_DASHBOARD,
  ROUTE_JOURNAL,
  ROUTE_PLANTS,
  ROUTE_REMINDERS,
  ROUTE_SETTINGS,
} from "@/lib/routes";

export type ProductNavItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

export function getProductNavItems(
  t: (key: string, options?: Record<string, unknown>) => string
): ProductNavItem[] {
  return [
    {
      href: ROUTE_DASHBOARD,
      label: t("dashboard", { ns: "nav" }),
      icon: Home,
    },
    {
      href: ROUTE_PLANTS,
      label: t("yourPlants", { ns: "dashboard" }),
      icon: Leaf,
    },
    {
      href: ROUTE_JOURNAL,
      label: t("journal", { ns: "nav" }),
      icon: Calendar,
    },
    {
      href: ROUTE_REMINDERS,
      label: t("reminders", { ns: "dashboard" }),
      icon: Bell,
    },
    {
      href: ROUTE_AI_ASSISTANT,
      label: t("assistant", { ns: "aiAssistant" }),
      icon: Brain,
    },
    {
      href: ROUTE_SETTINGS,
      label: t("settings", { ns: "nav" }),
      icon: Settings,
    },
  ];
}

export function isProductNavItemActive(pathname: string, href: string): boolean {
  if (href === ROUTE_DASHBOARD) {
    return pathname === ROUTE_DASHBOARD;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
