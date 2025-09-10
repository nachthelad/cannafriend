"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import type { LogEntry } from "@/types";
import { formatDateWithLocale } from "@/lib/utils";
import {
  Droplet,
  Zap,
  Scissors,
  Thermometer,
  Flower,
  StickyNote,
  Trash2,
  Edit,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";

interface MobileJournalEntryProps {
  log: LogEntry;
  showPlantName?: boolean;
  onDelete?: (log: LogEntry) => void;
  onEdit?: (log: LogEntry) => void;
  language: string;
}

export function MobileJournalEntry({
  log,
  showPlantName = false,
  onDelete,
  onEdit,
  language,
}: MobileJournalEntryProps) {
  const { t } = useTranslation(["journal", "common"]);
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  // Touch event handlers for swipe gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = dragX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentX = e.touches[0].clientX;
    const diffX = startXRef.current - currentX;
    const newDragX = Math.max(0, Math.min(120, currentXRef.current + diffX));
    setDragX(newDragX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragX > 60) {
      setDragX(120);
      setIsSwipeOpen(true);
    } else {
      setDragX(0);
      setIsSwipeOpen(false);
    }
  };

  // Close swipe when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setDragX(0);
        setIsSwipeOpen(false);
      }
    };

    if (isSwipeOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isSwipeOpen]);

  const getLogIcon = () => {
    switch (log.type) {
      case "watering":
        return <Droplet className="h-4 w-4" />;
      case "feeding":
        return <Zap className="h-4 w-4" />;
      case "training":
        return <Scissors className="h-4 w-4" />;
      case "environment":
        return <Thermometer className="h-4 w-4" />;
      case "flowering":
        return <Flower className="h-4 w-4" />;
      case "note":
        return <StickyNote className="h-4 w-4" />;
      default:
        return <StickyNote className="h-4 w-4" />;
    }
  };

  const getLogColor = () => {
    switch (log.type) {
      case "watering":
        return "text-blue-600 bg-blue-50 dark:bg-blue-950/20";
      case "feeding":
        return "text-green-600 bg-green-50 dark:bg-green-950/20";
      case "training":
        return "text-purple-600 bg-purple-50 dark:bg-purple-950/20";
      case "environment":
        return "text-orange-600 bg-orange-50 dark:bg-orange-950/20";
      case "flowering":
        return "text-pink-600 bg-pink-50 dark:bg-pink-950/20";
      case "note":
        return "text-gray-600 bg-gray-50 dark:bg-gray-950/20";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-950/20";
    }
  };

  const getLogDetails = () => {
    switch (log.type) {
      case "watering":
        return log.amount
          ? `${log.amount}${log.unit ?? "ml"}${log.method ? ` (${t(`${log.method}`, { ns: "watering" })})` : ""}`
          : null;
      case "feeding":
        return log.npk ? `${log.npk}${log.amount ? ` (${log.amount}ml/L)` : ""}` : null;
      case "training":
        return log.method ? t(`${log.method}`, { ns: "training" }) : null;
      case "environment":
        const envDetails = [];
        if (log.temperature) envDetails.push(`${log.temperature}°C`);
        if (log.humidity) envDetails.push(`${log.humidity}%`);
        if (log.ph) envDetails.push(`pH ${log.ph}`);
        return envDetails.join(" • ");
      case "flowering":
        return log.lightSchedule || null;
      default:
        return null;
    }
  };

  const handleDelete = () => {
    onDelete?.(log);
    setShowDeleteDialog(false);
    setDragX(0);
    setIsSwipeOpen(false);
  };

  const handleEdit = () => {
    onEdit?.(log);
    setDragX(0);
    setIsSwipeOpen(false);
  };

  return (
    <>
      <div className="relative overflow-hidden" ref={cardRef}>
        {/* Swipe Action Background */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-red-500 to-red-400 flex items-center justify-end pr-4 z-0">
          <div className="flex items-center gap-2 text-white">
            <Trash2 className="h-5 w-5" />
            <span className="text-sm font-medium">{t("delete", { ns: "common" })}</span>
          </div>
        </div>

        {/* Main Card */}
        <Card
          className={cn(
            "relative z-10 transition-transform duration-200 ease-out border-l-4",
            log.type === "watering" && "border-l-blue-500",
            log.type === "feeding" && "border-l-green-500",
            log.type === "training" && "border-l-purple-500",
            log.type === "environment" && "border-l-orange-500",
            log.type === "flowering" && "border-l-pink-500",
            log.type === "note" && "border-l-gray-500"
          )}
          style={{
            transform: `translateX(-${dragX}px)`,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              {/* Log Icon and Type */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={cn("p-2 rounded-lg shrink-0", getLogColor())}>
                  {getLogIcon()}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="secondary" className="shrink-0">
                        {t(`${log.type}`, { ns: "logType" })}
                      </Badge>
                      {showPlantName && log.plantName && (
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {log.plantName}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDateWithLocale(log.date, "MMM d, HH:mm", language)}
                    </span>
                  </div>

                  {/* Details */}
                  {getLogDetails() && (
                    <p className="text-sm font-medium text-foreground">
                      {getLogDetails()}
                    </p>
                  )}

                  {/* Notes */}
                  {log.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {log.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      {t("edit", { ns: "common" })}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("delete", { ns: "common" })}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Swipe delete trigger */}
        {dragX >= 120 && (
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Button
              size="sm"
              variant="destructive"
              className="shadow-lg"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteLog", { ns: "journal" })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteLogConfirm", { ns: "journal" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel", { ns: "common" })}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t("delete", { ns: "common" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
