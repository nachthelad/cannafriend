"use client";

import type { InlineEditProps } from "@/types/common";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Pencil } from "lucide-react";

export function InlineEdit({
  value,
  onSave,
  placeholder = "",
  className = "",
  inputClassName = "",
  showEditHint = true,
  forceEdit = false,
  onCancel,
  onStartEdit,
  clickToEdit = true,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      const len = inputRef.current.value.length;
      inputRef.current.focus();
      try {
        inputRef.current.setSelectionRange(len, len);
      } catch {}
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (forceEdit) setEditing(true);
  }, [forceEdit]);

  const commit = async () => {
    if (draft.trim() === value.trim()) {
      onCancel?.();
      setEditing(false);
      return;
    }
    await onSave(draft.trim());
    setEditing(false);
  };

  if (!editing) {
    if (!clickToEdit) {
      return (
        <span className={`inline-flex items-center gap-2 text-left ${className}`}>
          <span>
            {value || <span className="text-muted-foreground">{placeholder}</span>}
          </span>
        </span>
      );
    }
    return (
      <button
        type="button"
        className={`inline-flex items-center gap-2 text-left hover:bg-muted/40 rounded py-0.5 group ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
          onStartEdit?.();
        }}
        aria-label="Edit"
      >
        <span>
          {value || (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        {showEditHint && (
          <span className="text-muted-foreground/70 group-hover:text-foreground/80 pointer-events-none">
            <Pencil className="h-3.5 w-3.5" />
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className={`h-8 rounded border px-2 bg-muted/40 dark:bg-muted/30 ${inputClassName}`}
        placeholder={placeholder}
      />
      <Button
        size="icon"
        variant="secondary"
        className="h-8 w-8"
        onClick={(e) => {
          e.stopPropagation();
          void commit();
        }}
        aria-label="Save"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(false);
          onCancel?.();
        }}
        aria-label="Cancel"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
