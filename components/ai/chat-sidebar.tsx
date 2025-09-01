"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useTranslation } from "@/hooks/use-translation";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  MessageSquare,
  Plus,
  X,
  Menu,
  Brain,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSession {
  id: string;
  title: string;
  lastUpdated: string;
  chatType: "consumer" | "plant-analysis";
}

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  className?: string;
}

export function ChatSidebar({
  isOpen,
  onToggle,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  className,
}: ChatSidebarProps) {
  const { t } = useTranslation();
  const { user } = useAuthUser();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadChatHistory = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const chatQuery = query(
        collection(db, "users", user.uid, "aiChats"),
        orderBy("lastUpdated", "desc"),
        limit(20)
      );
      
      const snapshot = await getDocs(chatQuery);
      const sessions: ChatSession[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          title: data.title || "New Chat",
          lastUpdated: data.lastUpdated || new Date().toISOString(),
          chatType: data.chatType || "consumer",
        });
      });
      
      setChatSessions(sessions);
    } catch (error) {
      console.error("Error loading chat history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user?.uid) {
      loadChatHistory();
    }
  }, [isOpen, user?.uid]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return t("common.today");
    } else if (diffDays === 1) {
      return t("common.yesterday");
    } else if (diffDays < 7) {
      return `${diffDays} ${t("common.daysAgo")}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">{t("ai.chatHistory")}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          onClick={onNewChat}
          className="w-full flex items-center gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          {t("ai.newChat")}
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : chatSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("ai.noChats")}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {chatSessions.map((session) => (
              <Card
                key={session.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-accent",
                  currentSessionId === session.id && "bg-accent border-primary"
                )}
                onClick={() => onSessionSelect(session.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {session.title}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(session.lastUpdated)}</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      {session.chatType === "plant-analysis" ? (
                        <div className="w-2 h-2 rounded-full bg-green-500" title="Plant Analysis" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-blue-500" title="Consumer Chat" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex md:flex-col md:h-full md:bg-background md:border-r transition-all duration-300",
          isOpen ? "md:w-80" : "md:w-16",
          className
        )}
      >
        {/* Desktop Header */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            {isOpen ? (
              <>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary flex-shrink-0" />
                  <h2 className="font-semibold text-sm">{t("ai.chatHistory")}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-8 w-8 mx-auto"
                title={t("ai.chatHistory")}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          {isOpen && (
            <Button
              onClick={onNewChat}
              className="w-full flex items-center gap-2 mt-3 h-9 text-sm"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              {t("ai.newChat")}
            </Button>
          )}
        </div>

        {/* Desktop Chat List */}
        {isOpen ? (
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : chatSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">{t("ai.noChats")}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {chatSessions.map((session) => (
                  <Card
                    key={session.id}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-accent p-0",
                      currentSessionId === session.id && "bg-accent border-primary"
                    )}
                    onClick={() => onSessionSelect(session.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-xs truncate">
                            {session.title}
                          </h3>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">{formatDate(session.lastUpdated)}</span>
                          </div>
                        </div>
                        <div className="ml-2">
                          {session.chatType === "plant-analysis" ? (
                            <div className="w-2 h-2 rounded-full bg-green-500" title="Plant Analysis" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-blue-500" title="Consumer Chat" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Minimized state - show only new chat button
          <div className="flex flex-col items-center p-2 gap-2">
            <Button
              onClick={onNewChat}
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              title={t("ai.newChat")}
            >
              <Plus className="h-5 w-5" />
            </Button>
            {chatSessions.slice(0, 5).map((session, index) => (
              <Button
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 relative",
                  currentSessionId === session.id && "bg-accent"
                )}
                title={session.title}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {session.chatType === "plant-analysis" ? (
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                  )}
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}