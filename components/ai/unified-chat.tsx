"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { AnimatedLogo } from "@/components/common/animated-logo";
import { ImageUpload } from "@/components/common/image-upload";
import {
  Send,
  Image as ImageIcon,
  Brain,
  Leaf,
  User,
  Bot,
  Camera,
  X,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface UnifiedMessage {
  role: "user" | "assistant";
  content: string;
  images?: { url: string; type: string }[];
  timestamp: string;
}

interface UnifiedChatProps {
  sessionId?: string;
  className?: string;
}

export function UnifiedChat({ sessionId, className }: UnifiedChatProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuthUser();
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<{ url: string; type: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    sessionId
  );
  const [showImageUpload, setShowImageUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine chat type based on whether user has uploaded images
  const chatType = images.length > 0 ? "plant-analysis" : "consumer";

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() && images.length === 0) return;
    if (isLoading) return;

    const userMessage: UnifiedMessage = {
      role: "user",
      content: input.trim(),
      images: images.length > 0 ? images : undefined,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setImages([]);
    setIsLoading(true);

    try {
      const token = await user?.getIdToken();
      const response = await fetch("/api/unified-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          chatType,
          sessionId: currentSessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      const assistantMessage: UnifiedMessage = {
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages([...newMessages, assistantMessage]);

      // Update session ID if this was the first message
      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("ai.error"),
        description: error.message,
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleImageUpload = (urls: string[]) => {
    const newImages = urls.map((url) => ({ url, type: "image/jpeg" }));
    setImages((prev) => [...prev, ...newImages]);
    setShowImageUpload(false);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={cn("flex flex-col h-full max-w-4xl mx-auto", className)}>
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          {t("ai.assistant")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("ai.universalHelp")}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Brain className="h-16 w-16 mx-auto mb-4 text-primary/50" />
            <h3 className="text-lg font-semibold mb-2">{t("ai.welcome")}</h3>
            <p className="text-sm max-w-md mx-auto">{t("ai.helpText")}</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex gap-3 max-w-3xl",
              message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {message.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
            </div>

            <div
              className={cn(
                "flex-1 rounded-lg p-4 prose prose-sm max-w-none",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {message.images && message.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {message.images.map((img, imgIndex) => (
                    <div
                      key={imgIndex}
                      className="relative rounded-lg overflow-hidden"
                    >
                      <Image
                        src={img.url}
                        alt="Uploaded image"
                        width={200}
                        height={200}
                        className="object-cover w-full h-32"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Brain className="h-4 w-4" />
            </div>
            <div className="flex-1 bg-muted rounded-lg p-4">
              <AnimatedLogo size={16} className="text-primary" duration={1.2} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {images.length > 0 && (
        <div className="border-t p-4">
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img, index) => (
              <div key={index} className="relative flex-shrink-0">
                <Image
                  src={img.url}
                  alt="Upload preview"
                  width={80}
                  height={80}
                  className="rounded-lg object-cover"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 w-6 h-6"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t("ai.universalPlaceholder")}
              disabled={isLoading}
              className="pr-12"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1 w-8 h-8"
              onClick={() => setShowImageUpload(true)}
              disabled={isLoading}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || (!input.trim() && images.length === 0)}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t("ai.uploadPhoto")}</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowImageUpload(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ImageUpload
                onImagesChange={handleImageUpload}
                maxImages={3}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
