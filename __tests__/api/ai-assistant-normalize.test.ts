import {
  gpt5AssistantReply,
  gpt5NestedAssistantMessage,
} from "@/__tests__/fixtures/gpt5-assistant-message";

jest.mock("@/lib/firebase-admin", () => ({
  adminAuth: jest.fn(),
  ensureAdminApp: jest.fn(),
}));

let normalizeOpenAIContent: (message: unknown) => string;

beforeAll(async () => {
  // Polyfill minimal Web API pieces that next/server expects during import.
  // @ts-expect-error - provided only for test runtime
  global.Request = class Request {};
  // @ts-expect-error - provided only for test runtime
  global.Response = class Response {};
  // @ts-expect-error - provided only for test runtime
  global.Headers = class Headers {};

  ({ normalizeOpenAIContent } = await import("@/app/api/ai-assistant/route"));
});

describe("normalizeOpenAIContent", () => {
  it("unwraps nested gpt-5 assistant output into plain text", () => {
    const normalized = normalizeOpenAIContent(gpt5NestedAssistantMessage);
    expect(normalized).toBe(gpt5AssistantReply);
  });

  it("falls back to string content when already plain", () => {
    const normalized = normalizeOpenAIContent({
      role: "assistant",
      content: "Respuesta breve",
    });

    expect(normalized).toBe("Respuesta breve");
  });
});
