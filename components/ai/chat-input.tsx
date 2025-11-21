"use client";

import type { ChatInputProps } from "@/types/ai";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { forwardRef, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
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
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Auto-resize textarea
    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Disable auto-resize on mobile
      if (window.innerWidth < 768) {
        textarea.style.height = "40px"; // Reset to default height
        return;
      }

      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }, [value]);

    // Handle ref forwarding
    const setRefs = (element: HTMLTextAreaElement | null) => {
      textareaRef.current = element;
      if (typeof ref === "function") {
        ref(element);
      } else if (ref) {
        (ref as any).current = element;
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSendMessage();
      }
      if (onKeyPress) {
        onKeyPress(e as any);
      }
    };

    return (
      <div className="relative flex items-end">
        <div className="relative flex-1 flex items-end bg-muted/50 border hover:border-primary/20 focus-within:border-primary/50 focus-within:bg-background focus-within:ring-4 focus-within:ring-primary/5 transition-all duration-200 rounded-3xl px-2 py-1.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors mb-0.5"
            onClick={onShowImageUpload}
            disabled={isLoading}
            title="Upload image"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <textarea
            ref={setRefs}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("universalPlaceholder", { ns: "aiAssistant" })}
            disabled={isLoading}
            rows={1}
            className="flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus:outline-none px-3 py-2.5 min-h-[40px] max-h-[200px] resize-none text-base md:text-sm placeholder:text-muted-foreground/70 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
            style={{ overflowY: value.length > 100 ? "auto" : "hidden" }}
          />
          
          <Button
            onClick={onSendMessage}
            variant={value.trim() ? "default" : "ghost"}
            disabled={isLoading || !value.trim()}
            size="icon"
            className={cn(
              "h-9 w-9 rounded-full transition-all duration-200 mb-0.5",
              value.trim() 
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:scale-105" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className={cn("h-4 w-4", value.trim() && "ml-0.5")} />
            )}
          </Button>
        </div>
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";
