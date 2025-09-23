"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InlineEdit } from "@/components/common/inline-edit";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import React from "react";

export interface ChatListItemData {
  id: string;
  title: string;
  lastUpdated: string;
}

interface ChatListItemProps {
  session: ChatListItemData;
  active?: boolean;
  variant?: "mobile" | "desktop";
  onSelect: (id: string) => void;
  onRename: (id: string, newTitle: string) => Promise<void> | void;
  onDelete: (id: string) => void;
  setEditingId: (id: string | null) => void;
  editingId: string | null;
}

export function ChatListItem({
  session,
  active = false,
  variant = "mobile",
  onSelect,
  onRename,
  onDelete,
  setEditingId,
  editingId,
}: ChatListItemProps) {
  const base = variant === "mobile" ? "px-4 py-2" : "p-2";
  const isEditing = editingId === session.id;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!isEditing) onSelect(session.id);
      }}
      onKeyDown={(e) => {
        if (!isEditing && (e.key === "Enter" || e.key === " "))
          onSelect(session.id);
      }}
      className={cn(
        "w-full flex items-center justify-between rounded-xl hover:bg-accent text-left cursor-pointer",
        base,
        active && "bg-accent"
      )}
    >
      <div className="min-w-0 flex-1">
        <div
          className="font-medium text-[13px] truncate"
          onClick={(e) => {
            if (isEditing) e.stopPropagation();
          }}
        >
          <InlineEdit
            key={`${session.id}-${isEditing ? "editing" : "view"}`}
            value={session.title}
            clickToEdit={false}
            forceEdit={isEditing}
            onCancel={() => setEditingId(null)}
            onSave={async (newTitle) => {
              await onRename(session.id, newTitle);
              setEditingId(null);
            }}
            inputClassName={cn(
              "w-full",
              isEditing && active ? "rounded-xl text-foreground" : undefined
            )}
          />
        </div>
        {/* Date removed per request: no date display under chat title */}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(variant === "mobile" ? "h-6 w-6" : "h-7 w-7")}
            onClick={(e) => e.stopPropagation()}
            aria-label="Chat options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem
            onSelect={() => {
              setEditingId(session.id);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> Renombrar
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onSelect={() => {
              onDelete(session.id);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default ChatListItem;
