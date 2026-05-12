import type { PremiumSource } from "@/types";

type PremiumClaims = {
  premium?: boolean;
  premium_until?: number;
  source?: PremiumSource;
};

export interface PremiumState {
  isPremium: boolean;
  premiumUntil: number | null;
  source: PremiumSource;
}

export function resolvePremiumState(
  claims: PremiumClaims | null | undefined,
  localOverride = false,
): PremiumState {
  if (localOverride) {
    return {
      isPremium: true,
      premiumUntil: null,
      source: "local_override",
    };
  }

  const premiumUntil =
    typeof claims?.premium_until === "number" ? claims.premium_until : null;
  const timePremium = premiumUntil !== null && premiumUntil > Date.now();
  const boolPremium = Boolean(claims?.premium);
  const isPremium = boolPremium || timePremium;
  const source = claims?.source ?? (isPremium ? "admin" : "unknown");

  return {
    isPremium,
    premiumUntil,
    source,
  };
}

export function hasLocalPremiumOverride(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      window.localStorage.getItem("cf_premium_v1") === "1"
    );
  } catch {
    return false;
  }
}
