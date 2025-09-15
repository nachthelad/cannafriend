"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Camera } from "lucide-react";
import { useTranslation } from "react-i18next";
import { forwardRef } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSendMessage: () => void;
  onShowImageUpload: () => void;
  isLoading: boolean;
}

export const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(
  (
    {
      value,
      onChange,
      onKeyPress,
      onSendMessage,
      onShowImageUpload,
      isLoading,
    },
    ref
  ) => {
    const { t } = useTranslation(["aiAssistant"]);

    return (
      <div className="flex items-center border rounded-4xl bg-card p-2 shadow-sm">
        <Button
          size="icon"
          variant="ghost"
          className="ml-1"
          onClick={onShowImageUpload}
          disabled={isLoading}
        >
          <Camera className="h-4 w-4" />
        </Button>
        <Input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={t("universalPlaceholder", { ns: "aiAssistant" })}
          disabled={isLoading}
          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3 dark:bg-input/0"
        />
        <Button
          onClick={onSendMessage}
          variant="ghost"
          disabled={isLoading || !value.trim()}
          size="icon"
          className="mr-1"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";
