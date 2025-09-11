import type { auth } from "firebase-admin";

/**
 * Determines whether a user has an active premium subscription based on their custom claims.
 */
export function isUserPremium(user: auth.UserRecord): boolean {
  return Boolean((user.customClaims as Record<string, unknown> | undefined)?.premium);
}
