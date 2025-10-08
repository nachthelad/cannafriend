"use client";

import type { AIChatProps, AIImageAttachment, AIMessage } from "@/types/ai";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ThinkingAnimation } from "@/components/ai/thinking-animation";
import {
  ImageUpload,
  type ImageUploadHandle,
} from "@/components/common/image-upload";
import { Brain, User, X, Menu } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChatSidebar } from "@/components/ai/chat-sidebar";
import { ChatInput } from "@/components/ai/chat-input";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function AIChat({
  sessionId,
  className,
  sidebarOpen = false,
  onToggleSidebar,
}: AIChatProps) {
  const { t } = useTranslation(["aiAssistant", "common"]);
  const { toast } = useToast();
  const { user } = useAuthUser();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<AIImageAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    sessionId
  );
  // Sidebar state is now managed by parent component
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageUploadRef = useRef<ImageUploadHandle>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to live updates for the selected session so subsequent
  // messages persist and are reflected in the UI reliably.
  useEffect(() => {
    if (!user?.uid || !currentSessionId) return;
    const unsub = onSnapshot(
      doc(db, "users", user.uid, "aiChats", currentSessionId),
      (snap) => {
        const data = snap.data() as { messages?: AIMessage[] } | undefined;
        if (data?.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    );
    return () => unsub();
  }, [user?.uid, currentSessionId]);

  const handleSendMessage = async () => {
    if (!input.trim() && images.length === 0) return;
    if (isLoading) return;

    // Check if user is authenticated
    if (!user) {
      toast({
        variant: "destructive",
        title: t("error", { ns: "aiAssistant" }),
        description: "Please sign in to use the AI assistant",
      });
      return;
    }

    const userMessage: AIMessage = {
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
      // Get auth token with better error handling
      let token: string;
      try {
        token = await user.getIdToken();
      } catch (tokenError: any) {
        console.error("Failed to get auth token:", tokenError);
        throw new Error("Authentication failed. Please try signing in again.");
      }

      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          sessionId: currentSessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error("Authentication failed. Please sign in again.");
        } else if (response.status === 403) {
          throw new Error("Premium subscription required for AI assistant.");
        } else if (response.status === 429) {
          throw new Error(
            "Too many requests. Please wait a moment and try again."
          );
        }
        throw new Error(data.error || "Failed to send message");
      }

      const assistantMessage: AIMessage = {
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
      // Remove the user message if the request failed
      setMessages(messages);
      setInput(userMessage.content);
      setImages(userMessage.images || []);

      toast({
        variant: "destructive",
        title: t("error", { ns: "aiAssistant" }),
        description: error.message,
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleImageUpload = (urls: string[]) => {
    const newImages: AIImageAttachment[] = urls.map((url) => ({
      url,
      type: "image/jpeg",
    }));
    setImages((prev) => [...prev, ...newImages]);
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

  const loadChatSession = async (sessionId: string) => {
    if (!user?.uid) return;

    try {
      const chatDoc = await getDoc(
        doc(db, "users", user.uid, "aiChats", sessionId)
      );
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        setMessages(data.messages || []);
        setCurrentSessionId(sessionId);
        // Close sidebar after selecting a session on mobile only
        if (typeof window !== "undefined") {
          const isMobile = window.matchMedia("(max-width: 767px)").matches;
          if (isMobile && onToggleSidebar && sidebarOpen) {
            onToggleSidebar();
          }
        }
      }
    } catch (error) {
      console.error("Error loading chat session:", error);
      toast({
        variant: "destructive",
        title: t("error", { ns: "aiAssistant" }),
        description: "Failed to load chat session",
      });
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(undefined);
    onToggleSidebar && sidebarOpen && onToggleSidebar();
  };

  return (
    <div className={cn("flex h-full", className)}>
      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={onToggleSidebar || (() => {})}
        currentSessionId={currentSessionId}
        onSessionSelect={loadChatSession}
        onNewChat={handleNewChat}
      />

      {/* Main Chat */}
      <div className="flex flex-col flex-1 h-full max-w-4xl mx-auto">
        {/* Chat Content */}
        {messages.length === 0 ? (
          /* Centered Welcome State - ChatGPT Style */
          <div className="flex-1 flex flex-col items-center justify-center p-3 pb-20 md:pb-4">
            <div className="text-center mb-8 text-muted-foreground max-w-md">
              <p className="text-base mb-4">
                {t("helpText", { ns: "aiAssistant" })}
              </p>
            </div>

            {/* Centered Input */}
            <div className="w-full max-w-2xl">
              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mb-3">
                  <div className="flex gap-2 overflow-x-auto justify-center">
                    {images.map((img, index) => (
                      <div key={index} className="relative flex-shrink-0">
                        <div className="relative w-12 h-12 rounded-md overflow-hidden">
                          <Image
                            src={img.url}
                            alt="Upload preview"
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-1 -right-1 w-4 h-4"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <ChatInput
                ref={inputRef}
                value={input}
                onChange={setInput}
                onKeyPress={handleKeyPress}
                onSendMessage={handleSendMessage}
                onShowImageUpload={() => imageUploadRef.current?.open()}
                isLoading={isLoading}
              />
            </div>
          </div>
        ) : (
          /* Message View - Standard Chat Layout */
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-2 max-w-3xl",
                    message.role === "user"
                      ? "ml-auto flex-row-reverse"
                      : "mr-auto"
                  )}
                >
                  <div
                    className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Brain className="h-3.5 w-3.5" />
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex-1 rounded-lg p-3 prose prose-sm max-w-none",
                      message.role === "user"
                        ? "bg-gray-100 dark:bg-gray-800 text-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.images && message.images.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {message.images.map((img, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0"
                          >
                            <Image
                              src={img.url}
                              alt="Uploaded image"
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 max-w-3xl mr-auto">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div className="flex-1 bg-muted rounded-lg p-4">
                    <ThinkingAnimation />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview - Only in message mode */}
            {images.length > 0 && (
              <div className="border-t p-3">
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, index) => (
                    <div key={index} className="relative flex-shrink-0">
                      <div className="relative w-12 h-12 rounded-md overflow-hidden">
                        <Image
                          src={img.url}
                          alt="Upload preview"
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-1 -right-1 w-4 h-4"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input - Bottom position */}
            <div className="p-2 mb-3">
              <ChatInput
                ref={inputRef}
                value={input}
                onChange={setInput}
                onKeyPress={handleKeyPress}
                onSendMessage={handleSendMessage}
                onShowImageUpload={() => imageUploadRef.current?.open()}
                isLoading={isLoading}
              />
            </div>
          </>
        )}
        <ImageUpload
          ref={imageUploadRef}
          onImagesChange={handleImageUpload}
          maxImages={3}
          className="sr-only"
          hideDefaultTrigger
        />
      </div>
    </div>
  );
}
