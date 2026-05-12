import type { AIChatMode } from "@/types/ai";

export function normalizeChatMode(value: unknown): AIChatMode {
  if (value === "free_taste") {
    return "free_taste";
  }

  return "premium_chat";
}
