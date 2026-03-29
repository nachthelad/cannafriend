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
const mockFirestoreSet = jest.fn().mockResolvedValue(undefined);
const mockFirestoreGet = jest.fn().mockResolvedValue({ data: () => ({ messages: [] }) });

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
}));

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: () => ({
      doc: () => ({
        collection: () => ({
          doc: () => ({
            get: mockFirestoreGet,
            set: mockFirestoreSet,
            update: jest.fn().mockResolvedValue(undefined),
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
    // Default: rate limit passes
    mockCheckRateLimit.mockResolvedValue({ ok: true, limit: 20, remaining: 19, resetMs: 60000 });
    // Default: on-topic
    mockIsCannabisRelated.mockReturnValue(true);
    mockIsContextuallyOnTopic.mockReturnValue(false);

    ({ POST } = await import("@/app/api/ai-assistant/route"));
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

  it("returns 403 when REQUIRE_PREMIUM_FOR_AI=true and user has no premium", async () => {
    process.env.REQUIRE_PREMIUM_FOR_AI = "true";
    mockVerifyIdToken.mockResolvedValue({ uid: "u1", premium: false });

    const res = await POST(makeRequest({ messages: validMessages }, "Bearer valid"));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("premium_required");

    delete process.env.REQUIRE_PREMIUM_FOR_AI;
  });

  it("allows non-premium users when REQUIRE_PREMIUM_FOR_AI is not set", async () => {
    delete process.env.REQUIRE_PREMIUM_FOR_AI;
    mockVerifyIdToken.mockResolvedValue({ uid: "u1", premium: false });

    // Should proceed past premium check (will fail later for other reasons, but not 403)
    const res = await POST(makeRequest({ messages: validMessages }, "Bearer valid"));
    expect(res.status).not.toBe(403);
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

    const res = await POST(makeRequest({ messages: validMessages }, "Bearer valid"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toBeTruthy();
    expect(body.sessionId).toBeDefined();

    delete process.env.GEMINI_API_KEY;
  });

  it("passes through when message has images (always on-topic)", async () => {
    process.env.GEMINI_API_KEY = "fake-key";
    mockVerifyIdToken.mockResolvedValue(validDecoded);
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
    const res = await POST(makeRequest({ messages }, "Bearer valid"));
    expect(res.status).toBe(200);
    const body = await res.json();
    // A refusal message contains "cannabis" — a real response should not start with "Solo puedo"
    expect(body.response).not.toMatch(/Solo puedo responder/);

    delete process.env.GEMINI_API_KEY;
  });
});
