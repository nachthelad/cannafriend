// Centralized app routes and role-based home resolution

export const ROUTE_LOGIN = "/login" as const;
export const ROUTE_DASHBOARD = "/dashboard" as const;
export const ROUTE_ONBOARDING = "/onboarding" as const;
export const ROUTE_STRAINS = "/strains" as const;
export const ROUTE_PLANTS_NEW = "/plants/new" as const;
export const ROUTE_ANALYZE_PLANT = "/analyze-plant" as const;
export const ROUTE_AI_CONSUMER = "/ai-consumer" as const;
export const ROUTE_CONSUMER_CHAT = "/consumer-chat" as const;
export const ROUTE_PREMIUM = "/premium" as const;

export type AppPath =
  | typeof ROUTE_LOGIN
  | typeof ROUTE_DASHBOARD
  | typeof ROUTE_ONBOARDING
  | typeof ROUTE_STRAINS
  | typeof ROUTE_PLANTS_NEW
  | typeof ROUTE_ANALYZE_PLANT
  | typeof ROUTE_AI_CONSUMER
  | typeof ROUTE_CONSUMER_CHAT
  | string;

export type Roles = { grower: boolean; consumer: boolean };

export function resolveHomePathForRoles(
  roles: Roles | null | undefined
): AppPath {
  if (!roles) return ROUTE_DASHBOARD;
  const isConsumerOnly = roles.consumer && !roles.grower;
  if (isConsumerOnly) return ROUTE_STRAINS;
  return ROUTE_DASHBOARD;
}

export function consumerChatDetailPath(id: string): string {
  return `${ROUTE_CONSUMER_CHAT}/${id}`;
}
