"use client";

import { useEffect, useRef } from "react";
import { Search, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  placeholder?: string;
  /** Extra className for the trigger button */
  triggerClassName?: string;
}

/**
 * Mobile search pattern: a compact icon button that opens a
 * full-width floating overlay with an auto-focused input.
 * Shows a green dot indicator when a search is active.
 */
export function MobileSearchBar({
  value,
  onChange,
  isOpen,
  onOpen,
  onClose,
  placeholder,
  triggerClassName,
}: MobileSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when overlay opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Trigger button — icon only with active dot */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpen}
        className={`relative h-11 px-3 ${triggerClassName ?? ""}`}
        aria-label={placeholder}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        {value && (
          <span
            className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-green-500"
            aria-hidden="true"
          />
        )}
      </Button>

      {/* Floating overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Search bar */}
          <div className="fixed inset-x-0 top-0 z-50 flex items-center gap-2 border-b bg-background px-3 py-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 shrink-0 p-0"
              aria-label="Cerrar búsqueda"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                ref={inputRef}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-11 pl-10 pr-10"
              />
              {value && (
                <button
                  onClick={() => onChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
