// Centralized app routes and role-based home resolution
import type { Roles } from "@/types";

export const ROUTE_LOGIN = "/login" as const;
export const ROUTE_DASHBOARD = "/dashboard" as const;
export const ROUTE_ONBOARDING = "/onboarding" as const;
export const ROUTE_SESSIONS = "/sessions" as const;
export const ROUTE_PLANTS_NEW = "/plants/new" as const;
export const ROUTE_PLANTS = "/plants" as const;
export const ROUTE_AI_ASSISTANT = "/ai-assistant" as const;
export const ROUTE_CONSUMER_CHAT = "/consumer-chat" as const;
export const ROUTE_PREMIUM = "/premium" as const;
export const ROUTE_SETTINGS = "/settings" as const;
export const ROUTE_JOURNAL = "/journal" as const;
export const ROUTE_JOURNAL_NEW = "/journal/new" as const;
export const ROUTE_REMINDERS = "/reminders" as const;
export const ROUTE_REMINDERS_NEW = "/reminders/new" as const;
export const ROUTE_STASH = "/stash" as const;
export const ROUTE_STASH_NEW = "/stash/new" as const;
export const ROUTE_NUTRIENTS = "/nutrients" as const;
export const ROUTE_NUTRIENTS_NEW = "/nutrients/new" as const;
export const ROUTE_PRIVACY = "/privacy" as const;
export const ROUTE_TERMS = "/terms" as const;
export const ROUTE_ADMIN = "/admin" as const;
export const ROUTE_HOME = "/" as const;

export type AppPath =
  | typeof ROUTE_LOGIN
  | typeof ROUTE_DASHBOARD
  | typeof ROUTE_ONBOARDING
  | typeof ROUTE_SESSIONS
  | typeof ROUTE_PLANTS_NEW
  | typeof ROUTE_PLANTS
  | typeof ROUTE_CONSUMER_CHAT
  | typeof ROUTE_PREMIUM
  | typeof ROUTE_SETTINGS
  | typeof ROUTE_JOURNAL
  | typeof ROUTE_JOURNAL_NEW
  | typeof ROUTE_REMINDERS
  | typeof ROUTE_REMINDERS_NEW
  | typeof ROUTE_STASH
  | typeof ROUTE_STASH_NEW
  | typeof ROUTE_NUTRIENTS
  | typeof ROUTE_NUTRIENTS_NEW
  | typeof ROUTE_PRIVACY
  | typeof ROUTE_TERMS
  | typeof ROUTE_ADMIN
  | typeof ROUTE_HOME
  | string;

export type { Roles } from "@/types";

export function resolveHomePathForRoles(
  roles: Roles | null | undefined
): AppPath {
  if (!roles) return ROUTE_DASHBOARD;
  const isConsumerOnly = roles.consumer && !roles.grower;
  if (isConsumerOnly) return ROUTE_SESSIONS;
  return ROUTE_DASHBOARD;
}

export function consumerChatDetailPath(id: string): string {
  return `${ROUTE_CONSUMER_CHAT}/${id}`;
}
