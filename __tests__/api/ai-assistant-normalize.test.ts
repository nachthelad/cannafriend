import {
  gpt5AssistantReply,
  gpt5NestedAssistantMessage,
} from "@/test-utils/fixtures/gpt5-assistant-message";
import { normalizeOpenAIContent } from "@/lib/openai-normalize";

jest.mock("@/lib/firebase-admin", () => ({
  adminAuth: jest.fn(),
  ensureAdminApp: jest.fn(),
}));

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
