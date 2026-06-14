import {
  getPostAuthRedirect,
  isOnboardingComplete,
} from "@/lib/auth-redirect";
import { ROUTE_DASHBOARD, ROUTE_ONBOARDING } from "@/lib/routes";

describe("auth redirect", () => {
  it("sends missing profiles to onboarding", () => {
    expect(getPostAuthRedirect(null)).toBe(ROUTE_ONBOARDING);
    expect(getPostAuthRedirect(undefined)).toBe(ROUTE_ONBOARDING);
  });

  it("requires onboarding completion and a non-empty timezone", () => {
    expect(
      getPostAuthRedirect({
        onboardingCompletedAt: "2026-06-14T12:00:00.000Z",
        timezone: null,
      }),
    ).toBe(ROUTE_ONBOARDING);

    expect(
      getPostAuthRedirect({
        onboardingCompletedAt: "2026-06-14T12:00:00.000Z",
        timezone: "   ",
      }),
    ).toBe(ROUTE_ONBOARDING);

    expect(
      getPostAuthRedirect({
        timezone: "America/Buenos_Aires",
      }),
    ).toBe(ROUTE_ONBOARDING);
  });

  it("sends completed profiles to the dashboard", () => {
    const profile = {
      onboardingCompletedAt: "2026-06-14T12:00:00.000Z",
      timezone: "America/Buenos_Aires",
    };

    expect(isOnboardingComplete(profile)).toBe(true);
    expect(getPostAuthRedirect(profile)).toBe(ROUTE_DASHBOARD);
  });
});
