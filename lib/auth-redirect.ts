import { ROUTE_DASHBOARD, ROUTE_ONBOARDING } from "@/lib/routes";

type UserProfileRedirectData =
  | {
      onboardingCompletedAt?: unknown;
      timezone?: unknown;
    }
  | null
  | undefined;

export function isOnboardingComplete(
  profile: UserProfileRedirectData,
): boolean {
  return (
    Boolean(profile?.onboardingCompletedAt) &&
    typeof profile?.timezone === "string" &&
    profile.timezone.trim().length > 0
  );
}

export function getPostAuthRedirect(profile: UserProfileRedirectData) {
  return isOnboardingComplete(profile) ? ROUTE_DASHBOARD : ROUTE_ONBOARDING;
}
