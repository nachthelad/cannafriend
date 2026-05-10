import {
  Brain,
  Calendar,
  Bell,
  FilePen,
  Home,
  Leaf,
  Package,
  Settings,
} from "lucide-react";
import {
  ROUTE_AI_ASSISTANT,
  ROUTE_DASHBOARD,
  ROUTE_JOURNAL,
  ROUTE_PLANTS,
  ROUTE_REMINDERS,
  ROUTE_SESSIONS,
  ROUTE_SETTINGS,
  ROUTE_STASH,
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
      href: ROUTE_SESSIONS,
      label: t("title", { ns: "sessions" }),
      icon: FilePen,
    },
    {
      href: ROUTE_STASH,
      label: t("stash", { ns: "nav" }),
      icon: Package,
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
