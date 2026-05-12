/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockVerifyIdToken = jest.fn();
const mockCheckRateLimit = jest.fn();
const mockExtractClientIp = jest.fn(() => "127.0.0.1");
const mockIsCannabisRelated = jest.fn();
const mockIsContextuallyOnTopic = jest.fn();
const mockIsMetaQuestion = jest.fn();
const mockFirestoreSet = jest.fn().mockResolvedValue(undefined);
const mockFirestoreGet = jest.fn().mockResolvedValue({ data: () => undefined });
const mockFirestoreUpdate = jest.fn().mockResolvedValue(undefined);
const originalFetch = global.fetch;

jest.mock("@/lib/firebase-admin", () => ({
  adminAuth: () => ({ verifyIdToken: mockVerifyIdToken }),
  ensureAdminApp: jest.fn(),
}));

jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
  extractClientIp: (...args: any[]) => mockExtractClientIp(...args),
}));

jest.mock("@/lib/errors", () => ({
  unwrapError: jest.fn((err: unknown) => String(err)),
}));

jest.mock("@/lib/openai-normalize", () => ({
  normalizeOpenAIContent: jest.fn((msg: any) =>
    typeof msg?.content === "string" ? msg.content : null,
  ),
}));

jest.mock("@/app/api/ai-assistant/keywords", () => ({
  isCannabisRelated: (...args: any[]) => mockIsCannabisRelated(...args),
  isContextuallyOnTopic: (...args: any[]) => mockIsContextuallyOnTopic(...args),
  isMetaQuestion: (...args: any[]) => mockIsMetaQuestion(...args),
}));

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: () => ({
      doc: () => ({
        get: mockFirestoreGet,
        collection: () => ({
          doc: () => ({
            get: mockFirestoreGet,
            set: mockFirestoreSet,
            update: mockFirestoreUpdate,
          }),
        }),
      }),
    }),
  }),
}));

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      startChat: jest.fn().mockReturnValue({
        sendMessage: jest.fn().mockResolvedValue({
          response: { text: () => "Cannabis answer from Gemini" },
        }),
      }),
    }),
  })),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(body: unknown, authHeader?: string): NextRequest {
  return new NextRequest("http://localhost/api/ai-assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(body),
  });
}

const validMessages = [
  { role: "user", content: "How do I grow cannabis?", timestamp: new Date().toISOString() },
];

const validDecoded = { uid: "user-123", premium: true };

// ── Tests ──────────────────────────────────────────────────────────────────

describe("POST /api/ai-assistant", () => {
  let POST: typeof import("@/app/api/ai-assistant/route").POST;

  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "https://example.com/img.jpg") {
        return new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        });
      }
      throw new Error(`Unexpected fetch in test: ${url}`);
    }) as typeof fetch;
    // Default: rate limit passes
    mockCheckRateLimit.mockResolvedValue({ ok: true, limit: 20, remaining: 19, resetMs: 60000 });
    // Default: on-topic
    mockIsCannabisRelated.mockReturnValue(true);
    mockIsContextuallyOnTopic.mockReturnValue(false);
    mockIsMetaQuestion.mockReturnValue(false);

    ({ POST } = await import("@/app/api/ai-assistant/route"));
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ── Auth ──

  it("returns 401 when Authorization header is missing", async () => {
    const res = await POST(makeRequest({ messages: validMessages }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("missing_auth");
  });

  it("returns 401 when Authorization header has no bearer prefix", async () => {
    const res = await POST(makeRequest({ messages: validMessages }, "Basic token123"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("missing_auth");
  });

  it("returns 401 when verifyIdToken throws (invalid token)", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("Token expired"));
    const res = await POST(makeRequest({ messages: validMessages }, "Bearer invalid"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("invalid_auth");
  });

  // ── Premium ──

  it("returns 403 when a non-premium user requests premium_chat", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "u1", premium: false });

    const res = await POST(
      makeRequest(
        { messages: validMessages, chatType: "premium_chat" },
        "Bearer valid",
      ),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("premium_required");
  });

  it("allows non-premium users to use free_taste with an image", async () => {
    process.env.GEMINI_API_KEY = "fake-key";
    mockVerifyIdToken.mockResolvedValue({ uid: "u1", premium: false });
    const messages = [
      {
        role: "user",
        content: "Can you check this plant?",
        timestamp: new Date().toISOString(),
        images: [{ url: "https://example.com/img.jpg", type: "image/jpeg" }],
      },
    ];

    const res = await POST(
      makeRequest({ messages, chatType: "free_taste" }, "Bearer valid"),
    );
    expect(res.status).not.toBe(403);
    delete process.env.GEMINI_API_KEY;
  });

  it("returns 400 when free_taste is requested without an image", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "u1", premium: false });

    const res = await POST(
      makeRequest(
        { messages: validMessages, chatType: "free_taste" },
        "Bearer valid",
      ),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("image_required");
  });

  // ── Rate limit ──

  it("returns 429 with headers when rate limit is exceeded", async () => {
    mockVerifyIdToken.mockResolvedValue(validDecoded);
    mockCheckRateLimit.mockResolvedValue({ ok: false, limit: 20, remaining: 0, resetMs: 30000 });

    const res = await POST(makeRequest({ messages: validMessages }, "Bearer valid"));
    expect(res.status).toBe(429);
    expect(res.headers.get("x-ratelimit-limit")).toBe("20");
    expect(res.headers.get("x-ratelimit-remaining")).toBe("0");
    expect(res.headers.get("retry-after")).toBe("30");
  });

  // ── Input validation ──

  it("returns 400 when messages array is empty", async () => {
    mockVerifyIdToken.mockResolvedValue(validDecoded);

    const res = await POST(makeRequest({ messages: [] }, "Bearer valid"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("messages_required");
  });

  it("returns 400 when last message is not from user", async () => {
    mockVerifyIdToken.mockResolvedValue(validDecoded);
    const messages = [
      { role: "assistant", content: "Hello", timestamp: new Date().toISOString() },
    ];

    const res = await POST(makeRequest({ messages }, "Bearer valid"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("last_message_must_be_user");
  });

  // ── Topic guard ──

  it("returns refusal response (200) for off-topic messages", async () => {
    mockVerifyIdToken.mockResolvedValue(validDecoded);
    mockIsCannabisRelated.mockReturnValue(false);
    mockIsContextuallyOnTopic.mockReturnValue(false);

    const messages = [
      { role: "user", content: "What is the weather today?", timestamp: new Date().toISOString() },
    ];

    const res = await POST(makeRequest({ messages }, "Bearer valid"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toMatch(/cannabis/i);
    expect(body.sessionId).toBeDefined();
  });

  it("passes through when message is cannabis-related", async () => {
    process.env.GEMINI_API_KEY = "fake-key";
    mockVerifyIdToken.mockResolvedValue(validDecoded);
    mockIsCannabisRelated.mockReturnValue(true);

    const res = await POST(
      makeRequest(
        { messages: validMessages, chatType: "premium_chat" },
        "Bearer valid",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toBeTruthy();
    expect(body.sessionId).toBeDefined();

    delete process.env.GEMINI_API_KEY;
  });

  it("passes through when message has images (always on-topic)", async () => {
    process.env.GEMINI_API_KEY = "fake-key";
    mockVerifyIdToken.mockResolvedValue({ uid: "u1", premium: false });
    mockIsCannabisRelated.mockReturnValue(false);
    mockIsContextuallyOnTopic.mockReturnValue(false);

    const messages = [
      {
        role: "user",
        content: "What is this?",
        timestamp: new Date().toISOString(),
        images: [{ url: "https://example.com/img.jpg", type: "image/jpeg" }],
      },
    ];

    // Images bypass topic guard — should not return a refusal
    const res = await POST(
      makeRequest({ messages, chatType: "free_taste" }, "Bearer valid"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    // A refusal message contains "cannabis" — a real response should not start with "Solo puedo"
    expect(body.response).not.toMatch(/Solo puedo responder/);

    delete process.env.GEMINI_API_KEY;
  });
});
