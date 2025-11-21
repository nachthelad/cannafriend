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
import { Brain, User, X, Sparkles, ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChatSidebar } from "@/components/ai/chat-sidebar";
import { ChatInput } from "@/components/ai/chat-input";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageUploadRef = useRef<ImageUploadHandle>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to live updates
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

    if (!user) {
      toast({
        variant: "destructive",
        title: t("error", { ns: "aiAssistant" }),
        description: t("signInRequired", { ns: "aiAssistant" }),
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
      let token: string;
      try {
        token = await user.getIdToken();
      } catch (tokenError: any) {
        console.error("Failed to get auth token:", tokenError);
        throw new Error(t("authError", { ns: "aiAssistant" }));
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
        if (response.status === 401) {
          throw new Error(t("authError", { ns: "aiAssistant" }));
        } else if (response.status === 403) {
          throw new Error(t("premiumError", { ns: "aiAssistant" }));
        } else if (response.status === 429) {
          throw new Error(t("rateLimitError", { ns: "aiAssistant" }));
        }
        throw new Error(data.error || t("sendError", { ns: "aiAssistant" }));
      }

      const assistantMessage: AIMessage = {
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages([...newMessages, assistantMessage]);

      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId);
      }
    } catch (error: any) {
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
        description: t("loadError", { ns: "aiAssistant" }),
      });
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(undefined);
    onToggleSidebar && sidebarOpen && onToggleSidebar();
  };

  return (
    <div className={cn("flex h-full bg-background", className)}>
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={onToggleSidebar || (() => {})}
        currentSessionId={currentSessionId}
        onSessionSelect={loadChatSession}
        onNewChat={handleNewChat}
      />

      <div className="flex flex-col flex-1 h-full relative md:pb-0 pb-[140px]">
        {messages.length === 0 ? (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-3xl mx-auto w-full">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-2xl font-semibold text-center mb-2">
              {t("helpText", { ns: "aiAssistant" })}
            </h2>
            
            <p className="text-muted-foreground text-center mb-8 max-w-md">
              {t("helpSubtext", { ns: "aiAssistant" })}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
              <Card 
                variant="interactive" 
                className="p-4 cursor-pointer"
                onClick={() => setInput(t("diagnosePrompt", { ns: "aiAssistant" }))}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <ImageIcon className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{t("diagnoseIssue", { ns: "aiAssistant" })}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{t("diagnoseIssueDesc", { ns: "aiAssistant" })}</p>
                  </div>
                </div>
              </Card>

              <Card 
                variant="interactive" 
                className="p-4 cursor-pointer"
                onClick={() => setInput(t("feedingPrompt", { ns: "aiAssistant" }))}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Brain className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{t("feedingSchedule", { ns: "aiAssistant" })}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{t("feedingScheduleDesc", { ns: "aiAssistant" })}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Input Area for Empty State */}
            <div className="w-full">
              {images.length > 0 && (
                <div className="flex gap-3 overflow-x-auto mb-4 p-2 bg-muted/30 rounded-lg border border-dashed">
                  {images.map((img, index) => (
                    <div key={index} className="relative flex-shrink-0 group">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border bg-background shadow-sm">
                        <Image
                          src={img.url}
                          alt="Upload preview"
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
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
          // Messages List
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
              <div className="max-w-3xl mx-auto space-y-6 pb-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-4",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-1">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "flex flex-col max-w-[85%]",
                        message.role === "user" ? "items-end" : "items-start"
                      )}
                    >
                      {/* Images Grid */}
                      {message.images && message.images.length > 0 && (
                        <div className={cn(
                          "grid gap-2 mb-2",
                          message.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
                        )}>
                          {message.images.map((img, imgIndex) => (
                            <div
                              key={imgIndex}
                              className="relative rounded-xl overflow-hidden border bg-background shadow-sm group"
                              style={{ 
                                width: message.images!.length === 1 ? '240px' : '160px',
                                aspectRatio: '4/3'
                              }}
                            >
                              <Image
                                src={img.url}
                                alt="Uploaded image"
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, 300px"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Message Content */}
                      <div
                        className={cn(
                          "rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted/50 border text-foreground rounded-tl-sm"
                        )}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-background prose-pre:border prose-pre:rounded-lg">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {message.content}
                          </div>
                        )}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center mt-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-1">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted/30 border rounded-2xl rounded-tl-sm p-4 min-w-[200px]">
                      <ThinkingAnimation />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Sticky Input Area */}
            <div className="p-4 bg-background/80 backdrop-blur-sm border-t">
              <div className="max-w-3xl mx-auto w-full">
                {images.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto mb-3 p-2">
                    {images.map((img, index) => (
                      <div key={index} className="relative flex-shrink-0 group">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border bg-background">
                          <Image
                            src={img.url}
                            alt="Upload preview"
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <ChatInput
                  ref={inputRef}
                  value={input}
                  onChange={setInput}
                  onKeyPress={handleKeyPress}
                  onSendMessage={handleSendMessage}
                  onShowImageUpload={() => imageUploadRef.current?.open()}
                  isLoading={isLoading}
                />
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  {t("disclaimer", { ns: "aiAssistant" })}
                </p>
              </div>
            </div>
          </>
        )}

        <ImageUpload
          ref={imageUploadRef}
          onImagesChange={handleImageUpload}
          maxImages={3}
          className="sr-only"
          hideDefaultTrigger
          userId={user?.uid}
        />
      </div>
    </div>
  );
}
