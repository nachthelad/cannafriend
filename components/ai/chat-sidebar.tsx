"use client";

import type { ChatSession, ChatSidebarProps } from "@/types/ai";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useTranslation } from "react-i18next";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  MessageSquare,
  X,
  SquarePen,
  Search as SearchIcon,
} from "lucide-react";
import DarkModeLogo from "@/components/common/darkmode-logo";
import ChatListItem from "@/components/ai/chat-list-item";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ChatSidebar({
  isOpen,
  onToggle,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  className,
}: ChatSidebarProps) {
  const { t } = useTranslation(["aiAssistant", "common"]);
  const { user } = useAuthUser();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const sidebarContent = (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <DarkModeLogo size={24} className="ml-1.5" />
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3">
          <Button
            onClick={onNewChat}
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 gap-2 w-full justify-start"
          >
            <SquarePen className="h-4 w-4" />
            <span className="text-sm">
              {t("newChat", { ns: "aiAssistant" })}
            </span>
          </Button>
        </div>
        <div className="mt-2">
          <Button
            onClick={() => setShowSearchDialog(true)}
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 gap-2 w-full justify-start"
          >
            <SearchIcon className="h-4 w-4" />
            <span className="text-sm">{t("search", { ns: "common" })}</span>
          </Button>
        </div>
      </div>

      {/* Chat List (mobile dense variant) */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded-md animate-pulse" />
            ))}
          </div>
        ) : chatSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">{t("noChats", { ns: "aiAssistant" })}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {chatSessions.map((session) => (
              <ChatListItem
                key={session.id}
                session={session}
                active={currentSessionId === session.id}
                variant="mobile"
                editingId={editingId}
                setEditingId={setEditingId}
                onSelect={onSessionSelect}
                onRename={async (id, newTitle) => {
                  if (!user?.uid) return;
                  await updateDoc(doc(db, "users", user.uid, "aiChats", id), {
                    title: newTitle,
                  });
                  setChatSessions((prev) =>
                    prev.map((s) =>
                      s.id === id ? { ...s, title: newTitle } : s
                    )
                  );
                }}
                onDelete={(id) => {
                  setSelectedSession({
                    id,
                    title: session.title,
                    lastUpdated: session.lastUpdated,
                    chatType: "consumer",
                  });
                  setShowDeleteDialog(true);
                }}
              />
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
                <DarkModeLogo size={22} className="flex-shrink-0 ml-1.5" />
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
                title={t("chatHistory", { ns: "aiAssistant" })}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            )}
          </div>
          {isOpen && (
            <div className="mt-3 flex flex-col gap-2">
              <Button
                onClick={onNewChat}
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 gap-2 w-full justify-start"
              >
                <SquarePen className="h-4 w-4" />
                <span className="text-sm">
                  {t("newChat", { ns: "aiAssistant" })}
                </span>
              </Button>
              <Button
                onClick={() => setShowSearchDialog(true)}
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 gap-2 w-full justify-start"
              >
                <SearchIcon className="h-4 w-4" />
                <span className="text-sm">{t("search", { ns: "common" })}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Desktop Chat List */}
        {isOpen ? (
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-muted rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : chatSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">{t("noChats", { ns: "aiAssistant" })}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {chatSessions.map((session) => (
                  <div key={session.id} className="border-0 rounded-md">
                    <ChatListItem
                      session={session}
                      active={currentSessionId === session.id}
                      variant="desktop"
                      editingId={editingId}
                      setEditingId={setEditingId}
                      onSelect={onSessionSelect}
                      onRename={async (id, newTitle) => {
                        if (!user?.uid) return;
                        await updateDoc(
                          doc(db, "users", user.uid, "aiChats", id),
                          { title: newTitle }
                        );
                        setChatSessions((prev) =>
                          prev.map((s) =>
                            s.id === id ? { ...s, title: newTitle } : s
                          )
                        );
                      }}
                      onDelete={(id) => {
                        const s = chatSessions.find((c) => c.id === id)!;
                        setSelectedSession({
                          id,
                          title: s.title,
                          lastUpdated: s.lastUpdated,
                          chatType: "consumer",
                        });
                        setShowDeleteDialog(true);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Minimized state - show only action icons
          <div className="flex flex-col items-center p-2 gap-2">
            <Button
              onClick={onNewChat}
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              title={t("newChat", { ns: "aiAssistant" })}
            >
              <SquarePen className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setShowSearchDialog(true)}
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              title={t("search", { ns: "common" })}
            >
              <SearchIcon className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out md:hidden bg-background",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>

      {/* Search Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("search", { ns: "common" })}</DialogTitle>
          </DialogHeader>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("search", { ns: "common" })}
          />
          <div className="max-h-80 overflow-auto mt-2 space-y-1">
            {chatSessions
              .filter((s) =>
                searchQuery.trim()
                  ? s.title.toLowerCase().includes(searchQuery.toLowerCase())
                  : true
              )
              .map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    onSessionSelect(session.id);
                    setShowSearchDialog(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-accent"
                >
                  <div className="font-medium truncate">{session.title}</div>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.confirmDelete", { ns: "common" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.confirmDeleteDesc", { ns: "common" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("cancel", { ns: "common" })}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!user?.uid || !selectedSession) return;
                try {
                  await deleteDoc(
                    doc(db, "users", user.uid, "aiChats", selectedSession.id)
                  );
                  setChatSessions((prev) =>
                    prev.filter((s) => s.id !== selectedSession.id)
                  );
                  if (currentSessionId === selectedSession.id) {
                    onNewChat();
                  }
                } finally {
                  setShowDeleteDialog(false);
                  setSelectedSession(null);
                }
              }}
            >
              {t("delete", { ns: "common" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Inline renaming only; no rename modal */}
    </>
  );
}
