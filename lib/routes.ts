// Centralized app routes and role-based home resolution

export const ROUTE_LOGIN = "/login" as const;
export const ROUTE_DASHBOARD = "/dashboard" as const;
export const ROUTE_ONBOARDING = "/onboarding" as const;
export const ROUTE_STRAINS = "/strains" as const;
export const ROUTE_PLANTS_NEW = "/plants/new" as const;

export type AppPath =
  | typeof ROUTE_LOGIN
  | typeof ROUTE_DASHBOARD
  | typeof ROUTE_ONBOARDING
  | typeof ROUTE_STRAINS
  | typeof ROUTE_PLANTS_NEW
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
