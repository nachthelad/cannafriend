"use client";

import type { ChatInputProps } from "@/types/ai";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Loader2, History } from "lucide-react";
import { GeminiIcon, OpenAIIcon } from "@/components/icons/ai-brand-icons";
import { useTranslation } from "react-i18next";
import { forwardRef, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  (
    {
      value,
      onChange,
      onKeyPress,
      onSendMessage,
      onShowImageUpload,
      isLoading,
      provider,
      onProviderChange,
      onToggleSidebar,
    },
    ref,
  ) => {
    const { t } = useTranslation(["aiAssistant"]);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Auto-resize textarea
    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Disable auto-resize on mobile
      if (window.innerWidth < 768) {
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
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
      <div className="relative flex flex-col w-full bg-muted/40 border hover:border-primary/20 focus-within:border-primary/50 focus-within:bg-background/50 focus-within:ring-4 focus-within:ring-primary/5 transition-[border-color,background-color,box-shadow] duration-200 rounded-3xl p-2 sm:p-3 shadow-sm">
        {/* Top: Text Area */}
        <textarea
          ref={setRefs}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("universalPlaceholder", { ns: "aiAssistant" })}
          disabled={isLoading}
          rows={1}
          className="w-full border-0 bg-transparent shadow-none focus:ring-0 focus:outline-none px-2 py-2 min-h-[44px] max-h-[200px] resize-none text-base md:text-sm placeholder:text-muted-foreground/70 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
          style={{ overflowY: value.length > 100 ? "auto" : "hidden" }}
        />

        {/* Bottom: Controls Row */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40">
          {/* Left: Tools */}
          <div className="flex items-center gap-1">
            {onToggleSidebar && (
              <Button
                size="icon"
                variant="ghost"
                className="md:hidden h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                onClick={onToggleSidebar}
                disabled={isLoading}
                title="History"
              >
                <History className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              onClick={onShowImageUpload}
              disabled={isLoading}
              title="Upload image"
            >
              <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Right: Provider & Send */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Select value={provider} onValueChange={onProviderChange}>
              <SelectTrigger className="h-8 sm:h-9 w-[130px] sm:w-[140px] rounded-full text-xs sm:text-sm border-0 bg-transparent hover:bg-muted/50 focus:ring-0 px-2 sm:px-3 text-muted-foreground hover:text-foreground transition-colors">
                <div className="flex items-center gap-2">
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent align="end" className="rounded-xl">
                <SelectItem value="gemini" className="rounded-lg">
                  <div className="flex items-center gap-2">
                    <GeminiIcon size={16} />
                    <span>Gemini</span>
                  </div>
                </SelectItem>
                <SelectItem value="openai" className="rounded-lg">
                  <div className="flex items-center gap-2">
                    <OpenAIIcon size={16} />
                    <span>OpenAI</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={onSendMessage}
              variant={value.trim() ? "default" : "secondary"}
              disabled={isLoading || !value.trim()}
              size="icon"
              className={cn(
                "h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-[background-color,box-shadow,transform,opacity] duration-200",
                value.trim()
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:scale-105"
                  : "bg-muted text-muted-foreground/50 hover:bg-muted",
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
      </div>
    );
  },
);

ChatInput.displayName = "ChatInput";
