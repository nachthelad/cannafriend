import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Home from "@/app/(marketing)/page";
import { getDoc } from "firebase/firestore";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useRouter } from "next/navigation";
import {
  ROUTE_DASHBOARD,
  ROUTE_LOGIN,
  ROUTE_ONBOARDING,
} from "@/lib/routes";

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () =>
    function MockLandingView({
      authActionLabel,
      isAuthActionLoading,
      onAuthAction,
    }: {
      authActionLabel: string;
      isAuthActionLoading: boolean;
      onAuthAction: () => void;
    }) {
      return (
        <button disabled={isAuthActionLoading} onClick={onAuthAction}>
          {authActionLabel}
        </button>
      );
    },
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getDoc: jest.fn(),
}));

jest.mock("@/hooks/use-auth-user", () => ({
  useAuthUser: jest.fn(),
}));

jest.mock("@/lib/paths", () => ({
  userDoc: jest.fn(() => ({ path: "users/test-user" })),
}));

jest.mock("@/components/common/cookie-consent", () => ({
  CookieConsent: () => null,
}));

const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockUseAuthUser = useAuthUser as jest.MockedFunction<typeof useAuthUser>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const push = jest.fn();
const replace = jest.fn();

function mockProfile(data: Record<string, unknown> | null) {
  mockGetDoc.mockResolvedValue({
    exists: () => data !== null,
    data: () => data,
  } as Awaited<ReturnType<typeof getDoc>>);
}

describe("marketing home", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push,
      replace,
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("keeps anonymous visitors on the landing and opens login on click", () => {
    mockUseAuthUser.mockReturnValue({ user: null, isLoading: false });

    render(<Home />);

    const actions = screen.getAllByRole("button", { name: "nav.signIn" });
    fireEvent.click(actions[0]);

    expect(push).toHaveBeenCalledWith(ROUTE_LOGIN);
    expect(mockGetDoc).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("keeps completed users on the landing until they choose the dashboard", async () => {
    mockUseAuthUser.mockReturnValue({
      user: { uid: "test-user" },
      isLoading: false,
    } as ReturnType<typeof useAuthUser>);
    mockProfile({
      onboardingCompletedAt: "2026-06-17T12:00:00.000Z",
      timezone: "America/Buenos_Aires",
    });

    render(<Home />);

    const actions = await screen.findAllByRole("button", {
      name: "nav.goToDashboard",
    });
    expect(replace).not.toHaveBeenCalled();

    fireEvent.click(actions[0]);
    expect(push).toHaveBeenCalledWith(ROUTE_DASHBOARD);
  });

  it("offers onboarding when the authenticated profile is incomplete", async () => {
    mockUseAuthUser.mockReturnValue({
      user: { uid: "test-user" },
      isLoading: false,
    } as ReturnType<typeof useAuthUser>);
    mockProfile({ timezone: "America/Buenos_Aires" });

    render(<Home />);

    const actions = await screen.findAllByRole("button", {
      name: "nav.completeSetup",
    });
    fireEvent.click(actions[0]);

    expect(push).toHaveBeenCalledWith(ROUTE_ONBOARDING);
    expect(replace).not.toHaveBeenCalled();
  });

  it("disables the auth action while the profile is resolving", async () => {
    let resolveProfile: ((value: Awaited<ReturnType<typeof getDoc>>) => void) | null =
      null;
    mockUseAuthUser.mockReturnValue({
      user: { uid: "test-user" },
      isLoading: false,
    } as ReturnType<typeof useAuthUser>);
    mockGetDoc.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveProfile = resolve;
        }),
    );

    render(<Home />);

    const actions = screen.getAllByRole("button", { name: "loading" });
    expect(actions.every((action) => action.hasAttribute("disabled"))).toBe(true);

    await act(async () => {
      resolveProfile?.({
        exists: () => true,
        data: () => ({
          onboardingCompletedAt: "2026-06-17T12:00:00.000Z",
          timezone: "America/Buenos_Aires",
        }),
      } as Awaited<ReturnType<typeof getDoc>>);
    });
  });

  it("falls back to a manual dashboard action when profile loading fails", async () => {
    mockUseAuthUser.mockReturnValue({
      user: { uid: "test-user" },
      isLoading: false,
    } as ReturnType<typeof useAuthUser>);
    mockGetDoc.mockRejectedValue(new Error("Firestore unavailable"));

    render(<Home />);

    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: "nav.goToDashboard" }),
      ).not.toHaveLength(0);
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: "nav.goToDashboard" })[0],
    );
    expect(push).toHaveBeenCalledWith(ROUTE_DASHBOARD);
    expect(replace).not.toHaveBeenCalled();
  });
});
