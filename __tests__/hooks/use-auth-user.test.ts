import { renderHook, waitFor } from "@testing-library/react";
import {
  __resetAuthUserCacheForTests,
  useAuthUser,
} from "@/hooks/use-auth-user";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock("@/lib/firebase", () => ({
  auth: {
    signOut: jest.fn(),
    authStateReady: jest.fn().mockResolvedValue(undefined),
    currentUser: null,
  },
  db: {},
}));

jest.mock("@/lib/errors", () => ({
  unwrapError: jest.fn((err: unknown) => String(err)),
}));

const mockOnAuthStateChanged = jest.mocked(onAuthStateChanged);
const mockSignOut = jest.mocked(auth.signOut);
const mockAuthStateReady = jest.mocked(auth.authStateReady);

describe("useAuthUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetAuthUserCacheForTests();
    // Default: auth listener registered but never fires (pending state)
    mockOnAuthStateChanged.mockReturnValue(jest.fn());
    mockAuthStateReady.mockImplementation(
      () => new Promise<void>(() => undefined),
    );
    Object.assign(auth, { currentUser: null });
  });

  it("starts with isLoading=true before auth resolves", () => {
    const { result } = renderHook(() => useAuthUser());
    expect(result.current.isLoading).toBe(true);
  });

  it("sets user and isLoading=false when auth resolves with a valid user", async () => {
    const mockUser = {
      uid: "uid-123",
      getIdToken: jest.fn().mockResolvedValue("token-abc"),
    };
    Object.assign(auth, { currentUser: mockUser });
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      cb(mockUser as any);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuthUser());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBe(mockUser);
    expect(mockUser.getIdToken).toHaveBeenCalled();
  });

  it("sets user=null and isLoading=false when auth resolves with null", async () => {
    Object.assign(auth, { currentUser: null });
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      cb(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuthUser());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("clears user and calls signOut on token-expired error", async () => {
    const mockUser = {
      uid: "uid-123",
      getIdToken: jest.fn().mockRejectedValue({ code: "auth/user-token-expired" }),
    };
    Object.assign(auth, { currentUser: mockUser });
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      cb(mockUser as any);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuthUser());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("clears user and calls signOut on auth/user-disabled error", async () => {
    const mockUser = {
      uid: "uid-123",
      getIdToken: jest.fn().mockRejectedValue({ code: "auth/user-disabled" }),
    };
    Object.assign(auth, { currentUser: mockUser });
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      cb(mockUser as any);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuthUser());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("clears user but does NOT call signOut on network error", async () => {
    const mockUser = {
      uid: "uid-123",
      getIdToken: jest.fn().mockRejectedValue({ code: "auth/network-request-failed" }),
    };
    Object.assign(auth, { currentUser: mockUser });
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      cb(mockUser as any);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuthUser());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("keeps user authenticated on unrecognized token error", async () => {
    const mockUser = {
      uid: "uid-123",
      getIdToken: jest.fn().mockRejectedValue({ code: "auth/unknown-code" }),
    };
    Object.assign(auth, { currentUser: mockUser });
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      cb(mockUser as any);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuthUser());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBe(mockUser);
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("unsubscribes from auth listener on unmount", async () => {
    const mockUnsub = jest.fn();
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      cb(null);
      return mockUnsub;
    });

    const { unmount } = renderHook(() => useAuthUser());
    await waitFor(() => true);
    unmount();

    expect(mockUnsub).toHaveBeenCalled();
  });
});
