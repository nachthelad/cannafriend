/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

const mockVerifyIdToken = jest.fn();
const mockCheckRateLimit = jest.fn();
const mockExtractClientIp = jest.fn(() => "127.0.0.1");
const mockIsCannabisRelated = jest.fn();
const mockIsContextuallyOnTopic = jest.fn();
const mockIsMetaQuestion = jest.fn();
const mockFirestoreSet = jest.fn().mockResolvedValue(undefined);
const mockFirestoreGet = jest.fn().mockResolvedValue({ data: () => undefined });
const mockFirestoreUpdate = jest.fn().mockResolvedValue(undefined);
const mockResponsesCreate = jest.fn();
const mockOpenAIConstructor = jest.fn().mockImplementation(() => ({
  responses: {
    create: mockResponsesCreate,
  },
}));
const originalFetch = global.fetch;

class MockAPIError extends Error {
  status?: number;
  headers?: Headers;
  error?: unknown;
  code?: string | null;
  param?: string | null;
  type?: string;
  requestID?: string | null;

  constructor(
    status: number | undefined,
    error: { message?: string; code?: string } | undefined,
    message?: string,
    headers?: Headers,
  ) {
    super(message || error?.message || "OpenAI error");
    this.status = status;
    this.headers = headers;
    this.error = error;
    this.code = error?.code;
    this.param = null;
    this.type = undefined;
    this.requestID = null;
  }
}

class MockAPIConnectionError extends Error {}
class MockAPIConnectionTimeoutError extends MockAPIConnectionError {}

jest.mock("@/lib/firebase-admin", () => ({
  adminAuth: () => ({ verifyIdToken: mockVerifyIdToken }),
  ensureAdminApp: jest.fn(),
}));

jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
  extractClientIp: (...args: any[]) => mockExtractClientIp(...args),
}));

jest.mock("@/lib/errors", () => ({
  unwrapError: jest.fn((err: unknown, fallback?: string) =>
    err instanceof Error ? err.message : fallback || String(err),
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

jest.mock("openai", () => ({
  __esModule: true,
  default: mockOpenAIConstructor,
  APIError: MockAPIError,
  APIConnectionError: MockAPIConnectionError,
  APIConnectionTimeoutError: MockAPIConnectionTimeoutError,
}));

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
  {
    role: "user",
    content: "How do I grow cannabis?",
    timestamp: new Date().toISOString(),
  },
];

const validDecoded = { uid: "user-123", premium: true };

describe("POST /api/ai-assistant", () => {
  let POST: typeof import("@/app/api/ai-assistant/route").POST;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.OPENAI_PROJECT_ID = "proj_test";
    process.env.AI_GEMINI_FALLBACK_ENABLED = "false";
    process.env.OPENAI_IMAGE_DETAIL = "high";
    process.env.OPENAI_REASONING_EFFORT = "minimal";
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_PRIMARY_MODEL;
    delete process.env.OPENAI_FALLBACK_MODELS;

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

    mockCheckRateLimit.mockResolvedValue({
      ok: true,
      limit: 20,
      remaining: 19,
      resetMs: 60_000,
    });
    mockIsCannabisRelated.mockReturnValue(true);
    mockIsContextuallyOnTopic.mockReturnValue(false);
    mockIsMetaQuestion.mockReturnValue(false);
    mockResponsesCreate.mockResolvedValue({
      output_text: "Cannabis answer from OpenAI",
      model: "gpt-5-mini",
    });

    ({ POST } = await import("@/app/api/ai-assistant/route"));
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await POST(makeRequest({ messages: validMessages }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("missing_auth");
  });

  it("returns 403 when a non-premium user requests premium_chat", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "u1", premium: false });

    const res = await POST(
      makeRequest(
        { messages: validMessages, chatType: "premium_chat" },
        "Bearer valid",
      ),
    );

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("premium_required");
  });

  it("allows free_taste with images through OpenAI and returns model/provider", async () => {
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

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.provider).toBe("openai");
    expect(body.model).toBe("gpt-5-mini");
    expect(body.response).toBe("Cannabis answer from OpenAI");
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
    expect((await res.json()).error).toBe("image_required");
  });

  it("returns 429 with headers when rate limit is exceeded", async () => {
    mockVerifyIdToken.mockResolvedValue(validDecoded);
    mockCheckRateLimit.mockResolvedValue({
      ok: false,
      limit: 20,
      remaining: 0,
      resetMs: 30_000,
    });

    const res = await POST(makeRequest({ messages: validMessages }, "Bearer valid"));

    expect(res.status).toBe(429);
    expect(res.headers.get("x-ratelimit-limit")).toBe("20");
    expect(res.headers.get("x-ratelimit-remaining")).toBe("0");
    expect(res.headers.get("retry-after")).toBe("30");
  });

  it("returns refusal response with null model/provider for off-topic messages", async () => {
    mockVerifyIdToken.mockResolvedValue(validDecoded);
    mockIsCannabisRelated.mockReturnValue(false);
    mockIsContextuallyOnTopic.mockReturnValue(false);

    const messages = [
      {
        role: "user",
        content: "What is the weather today?",
        timestamp: new Date().toISOString(),
      },
    ];

    const res = await POST(makeRequest({ messages }, "Bearer valid"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toMatch(/cannabis/i);
    expect(body.provider).toBeNull();
    expect(body.model).toBeNull();
  });

  it("builds a Responses API payload with only latest-turn images and high detail", async () => {
    mockVerifyIdToken.mockResolvedValue(validDecoded);
    const messages = [
      {
        role: "user",
        content: "This was yesterday",
        timestamp: new Date().toISOString(),
        images: [{ url: "https://example.com/img.jpg", type: "image/jpeg" }],
      },
      {
        role: "assistant",
        content: "I saw some discoloration.",
        timestamp: new Date().toISOString(),
      },
      {
        role: "user",
        content: "And what about this new photo?",
        timestamp: new Date().toISOString(),
        images: [{ url: "https://example.com/img.jpg", type: "image/jpeg" }],
      },
    ];

    const res = await POST(
      makeRequest(
        { messages, chatType: "premium_chat" },
        "Bearer valid",
      ),
    );

    expect(res.status).toBe(200);
    expect(mockResponsesCreate).toHaveBeenCalledTimes(1);
    const request = mockResponsesCreate.mock.calls[0][0];
    expect(request.model).toBe("gpt-5-mini");
    expect(request.reasoning).toEqual({ effort: "minimal" });

    const input = request.input as Array<{ role: string; content: Array<{ type: string; detail?: string }> }>;
    expect(input[0].role).toBe("developer");

    const historicalUserMessage = input[1];
    expect(historicalUserMessage.content).toEqual([
      { type: "input_text", text: "This was yesterday" },
    ]);

    const assistantContextMessage = input[2];
    expect(assistantContextMessage.role).toBe("assistant");
    expect(assistantContextMessage.content).toEqual([
      {
        type: "output_text",
        text: "I saw some discoloration.",
        annotations: [],
      },
    ]);

    const latestUserMessage = input[3];
    expect(latestUserMessage.content).toEqual([
      { type: "input_text", text: "And what about this new photo?" },
      {
        type: "input_image",
        image_url: "https://example.com/img.jpg",
        detail: "high",
      },
    ]);
  });

  it("accepts follow-up requests after an assistant reply without using input_text for assistant context", async () => {
    mockVerifyIdToken.mockResolvedValue(validDecoded);
    mockIsCannabisRelated.mockReturnValue(false);
    mockIsContextuallyOnTopic.mockReturnValue(true);

    const messages = [
      {
        role: "user",
        content: "Can you analyze this plant?",
        timestamp: new Date().toISOString(),
        images: [{ url: "https://example.com/img.jpg", type: "image/jpeg" }],
      },
      {
        role: "assistant",
        content: "The canopy is uneven and the lower growth is shaded.",
        timestamp: new Date().toISOString(),
      },
      {
        role: "user",
        content: "What do you mean by canopy?",
        timestamp: new Date().toISOString(),
      },
    ];

    const res = await POST(
      makeRequest(
        { messages, chatType: "premium_chat" },
        "Bearer valid",
      ),
    );

    expect(res.status).toBe(200);
    const request = mockResponsesCreate.mock.calls[0][0];
    const assistantContextMessage = request.input[2];
    expect(assistantContextMessage.role).toBe("assistant");
    expect(assistantContextMessage.content[0].type).toBe("output_text");
  });

  it("falls back from gpt-5-mini to gpt-4.1-mini when the primary model is unavailable", async () => {
    mockVerifyIdToken.mockResolvedValue(validDecoded);
    mockResponsesCreate
      .mockRejectedValueOnce(
        new MockAPIError(
          404,
          { message: "model_not_found", code: "model_not_found" },
          "model_not_found",
        ),
      )
      .mockResolvedValueOnce({
        output_text: "Fallback answer",
        model: "gpt-4.1-mini",
      });

    const res = await POST(
      makeRequest(
        { messages: validMessages, chatType: "premium_chat" },
        "Bearer valid",
      ),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.model).toBe("gpt-4.1-mini");
    expect(mockResponsesCreate).toHaveBeenCalledTimes(2);
    expect(mockResponsesCreate.mock.calls[0][0].model).toBe("gpt-5-mini");
    expect(mockResponsesCreate.mock.calls[1][0].model).toBe("gpt-4.1-mini");
  });

  it("falls through the full OpenAI candidate list before succeeding on gpt-4o-mini", async () => {
    mockVerifyIdToken.mockResolvedValue(validDecoded);
    mockResponsesCreate
      .mockRejectedValueOnce(
        new MockAPIError(
          404,
          { message: "model_not_found", code: "model_not_found" },
          "model_not_found",
        ),
      )
      .mockRejectedValueOnce(
        new MockAPIError(
          404,
          { message: "does not have access", code: "model_not_found" },
          "does not have access",
        ),
      )
      .mockResolvedValueOnce({
        output_text: "Last fallback answer",
        model: "gpt-4o-mini",
      });

    const res = await POST(
      makeRequest(
        { messages: validMessages, chatType: "premium_chat" },
        "Bearer valid",
      ),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.model).toBe("gpt-4o-mini");
    expect(mockResponsesCreate.mock.calls.map(([call]) => call.model)).toEqual([
      "gpt-5-mini",
      "gpt-4.1-mini",
      "gpt-4o-mini",
    ]);
  });

  it("uses Gemini fallback only when explicitly enabled", async () => {
    process.env.AI_GEMINI_FALLBACK_ENABLED = "true";
    process.env.GEMINI_API_KEY = "fake-gemini-key";
    jest.resetModules();
    ({ POST } = await import("@/app/api/ai-assistant/route"));

    mockVerifyIdToken.mockResolvedValue(validDecoded);
    mockResponsesCreate.mockRejectedValue(
      new MockAPIError(500, { message: "server_error" }, "server_error"),
    );

    const res = await POST(
      makeRequest(
        { messages: validMessages, chatType: "premium_chat" },
        "Bearer valid",
      ),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.provider).toBe("gemini");
    expect(body.providerSwitched).toBe(true);
    expect(body.model).toBe("gemini-2.5-flash-lite");
  });

  it("persists provider and modelUsed for premium chats", async () => {
    mockVerifyIdToken.mockResolvedValue(validDecoded);

    const res = await POST(
      makeRequest(
        { messages: validMessages, chatType: "premium_chat" },
        "Bearer valid",
      ),
    );

    expect(res.status).toBe(200);
    expect(mockFirestoreSet).toHaveBeenCalled();
    const [chatData] = mockFirestoreSet.mock.calls.at(-1) || [];
    expect(chatData.provider).toBe("openai");
    expect(chatData.modelUsed).toBe("gpt-5-mini");
  });
});
