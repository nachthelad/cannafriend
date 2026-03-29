import { renderHook, waitFor } from "@testing-library/react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock("@/lib/firebase", () => ({
  auth: { signOut: jest.fn() },
  db: {},
}));

jest.mock("@/lib/errors", () => ({
  unwrapError: jest.fn((err: unknown) => String(err)),
}));

const mockOnAuthStateChanged = jest.mocked(onAuthStateChanged);
const mockSignOut = jest.mocked(auth.signOut);

describe("useAuthUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: auth listener registered but never fires (pending state)
    mockOnAuthStateChanged.mockReturnValue(jest.fn());
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
