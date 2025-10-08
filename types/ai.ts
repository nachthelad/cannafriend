import type { KeyboardEvent } from "react";

export interface AIImageAttachment {
  url: string;
  type: string;
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
  images?: AIImageAttachment[];
  timestamp: string;
}

export interface AIChatProps {
  sessionId?: string;
  className?: string;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export interface ChatSession {
  id: string;
  title: string;
  lastUpdated: string;
  chatType: "consumer" | "plant-analysis";
}

export interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  className?: string;
}

export interface ChatListItemData {
  id: string;
  title: string;
  lastUpdated: string;
}

export interface ChatListItemProps {
  session: ChatListItemData;
  active?: boolean;
  variant?: "mobile" | "desktop";
  onSelect: (id: string) => void;
  onRename: (id: string, newTitle: string) => Promise<void> | void;
  onDelete: (id: string) => void;
  setEditingId: (id: string | null) => void;
  editingId: string | null;
}

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  onShowImageUpload: () => void;
  isLoading: boolean;
}

export interface ThinkingAnimationProps {
  className?: string;
}
