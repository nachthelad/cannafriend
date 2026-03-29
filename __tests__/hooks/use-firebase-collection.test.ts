import { renderHook, waitFor } from "@testing-library/react";

const mockGetDocs = jest.fn();
const mockOnSnapshot = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: (...args: any[]) => mockCollection(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  query: (...args: any[]) => mockQuery(...args),
  orderBy: jest.fn(),
  limit: jest.fn(),
  where: jest.fn(),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
}));

jest.mock("@/lib/firebase", () => ({ db: {} }));

jest.mock("@/lib/errors", () => ({
  unwrapError: jest.fn((err: unknown, fallback?: string) => fallback ?? String(err)),
}));

// Controlled mock for useAuthUser
const mockUseAuthUser = jest.fn();
jest.mock("@/hooks/use-auth-user", () => ({
  useAuthUser: () => mockUseAuthUser(),
}));

// Helper: build a fake Firestore snapshot
function makeSnapshot(docs: { id: string; data: Record<string, unknown> }[]) {
  return {
    docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
  };
}

describe("useFirebaseCollection", () => {
  let useFirebaseCollection: typeof import("@/hooks/use-firebase-collection").useFirebaseCollection;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCollection.mockReturnValue("collectionRef");
    mockQuery.mockReturnValue("queryRef");
    ({ useFirebaseCollection } = await import(
      "@/hooks/use-firebase-collection"
    ));
  });

  it("returns empty data and loading=false when enabled=false", async () => {
    mockUseAuthUser.mockReturnValue({ user: { uid: "u1" } });

    const { result } = renderHook(() =>
      useFirebaseCollection("plants", { enabled: false }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it("returns empty data and loading=false when user is null", async () => {
    mockUseAuthUser.mockReturnValue({ user: null });

    const { result } = renderHook(() =>
      useFirebaseCollection("plants"),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([]);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it("replaces {userId} in collection path with actual uid", async () => {
    mockUseAuthUser.mockReturnValue({ user: { uid: "user-xyz" } });
    mockGetDocs.mockResolvedValue(makeSnapshot([]));

    renderHook(() => useFirebaseCollection("users/{userId}/plants"));

    await waitFor(() => expect(mockCollection).toHaveBeenCalled());
    expect(mockCollection).toHaveBeenCalledWith({}, "users/user-xyz/plants");
  });

  it("returns mapped documents with id merged from doc.id", async () => {
    mockUseAuthUser.mockReturnValue({ user: { uid: "u1" } });
    mockGetDocs.mockResolvedValue(
      makeSnapshot([
        { id: "plant-1", data: { name: "OG Kush", growType: "indoor" } },
        { id: "plant-2", data: { name: "Blue Dream", growType: "outdoor" } },
      ]),
    );

    const { result } = renderHook(() => useFirebaseCollection("plants"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([
      { id: "plant-1", name: "OG Kush", growType: "indoor" },
      { id: "plant-2", name: "Blue Dream", growType: "outdoor" },
    ]);
    expect(result.current.error).toBeNull();
  });

  it("sets error string when getDocs throws", async () => {
    mockUseAuthUser.mockReturnValue({ user: { uid: "u1" } });
    mockGetDocs.mockRejectedValue(new Error("Permission denied"));

    const { result } = renderHook(() => useFirebaseCollection("plants"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });

  it("calls onSnapshot instead of getDocs when realtime=true", async () => {
    mockUseAuthUser.mockReturnValue({ user: { uid: "u1" } });
    mockOnSnapshot.mockImplementation((_ref: any, cb: any) => {
      cb(makeSnapshot([{ id: "r1", data: { name: "Reminder" } }]));
      return jest.fn(); // unsubscribe
    });

    const { result } = renderHook(() =>
      useFirebaseCollection("reminders", { realtime: true }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockOnSnapshot).toHaveBeenCalled();
    expect(mockGetDocs).not.toHaveBeenCalled();
    expect(result.current.data).toEqual([{ id: "r1", name: "Reminder" }]);
  });

  it("refetch re-runs getDocs and updates data", async () => {
    mockUseAuthUser.mockReturnValue({ user: { uid: "u1" } });
    mockGetDocs
      .mockResolvedValueOnce(makeSnapshot([{ id: "p1", data: { name: "First" } }]))
      .mockResolvedValueOnce(makeSnapshot([{ id: "p2", data: { name: "Second" } }]));

    const { result } = renderHook(() => useFirebaseCollection("plants"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data[0].name).toBe("First");

    await waitFor(() => result.current.refetch());
    await waitFor(() => expect(result.current.data[0].name).toBe("Second"));
  });
});
