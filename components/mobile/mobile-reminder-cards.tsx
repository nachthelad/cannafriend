"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { triggerHaptic } from "@/lib/haptic";
import {
  Bell,
  Clock,
  Droplet,
  Leaf,
  Scissors,
  CheckCircle,
  MoreHorizontal,
  Calendar,
  X,
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
import type { Reminder } from "@/types";

interface MobileReminderCardsProps {
  reminders: Reminder[];
  onComplete: (reminderId: string, intervalDays: number) => void;
  onSnooze: (reminderId: string, hours: number) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (reminderId: string) => void;
  className?: string;
}

export function MobileReminderCards({
  reminders,
  onComplete,
  onSnooze,
  onEdit,
  onDelete,
  className,
}: MobileReminderCardsProps) {
  const { t } = useTranslation(["reminders", "common", "journal"]);
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();
  const [swipeState, setSwipeState] = useState<{
    id: string;
    direction: "left" | "right" | null;
    offset: number;
  }>({ id: "", direction: null, offset: 0 });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(
    null
  );
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const overdueReminders = reminders.filter(
    (r) => r.isActive && new Date(r.nextReminder) < now
  );
  const dueSoonThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dueSoonReminders = reminders.filter((r) => {
    const next = new Date(r.nextReminder);
    return r.isActive && next >= now && next <= dueSoonThreshold;
  });

  const getReminderIcon = (type: Reminder["type"]) => {
    switch (type) {
      case "watering":
        return <Droplet className="h-5 w-5 text-blue-500" />;
      case "feeding":
        return <Leaf className="h-5 w-5 text-green-500" />;
      case "training":
        return <Scissors className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getReminderTypeColor = (type: Reminder["type"]) => {
    switch (type) {
      case "watering":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "feeding":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "training":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatTimeUntilDue = (nextReminder: string) => {
    const next = new Date(nextReminder);
    const diffMs = next.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      const overdueDays = Math.abs(diffDays);
      return overdueDays === 0
        ? t("overdue", { ns: "reminders" })
        : `${overdueDays} ${t("daysAgo", { ns: "common" })}`;
    }

    if (diffDays === 0) {
      return diffHours <= 1
        ? t("dueSoon", { ns: "reminders" })
        : `${diffHours}h`;
    }

    return diffDays === 1
      ? t("tomorrow", { ns: "common" })
      : `${diffDays} ${t("days", { ns: "reminders" })}`;
  };

  const handleTouchStart = (e: React.TouchEvent, reminderId: string) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    triggerHaptic("light");
  };

  const handleTouchMove = (e: React.TouchEvent, reminderId: string) => {
    if (!touchStartX.current) return;

    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX.current;
    const diffY = touch.clientY - touchStartY.current;

    // Only handle horizontal swipes (prevent vertical scroll interference)
    if (Math.abs(diffY) > Math.abs(diffX)) return;

    // Prevent default to avoid scrolling during swipe
    e.preventDefault();

    // Minimum 50px swipe threshold
    if (Math.abs(diffX) > 50) {
      const direction = diffX > 0 ? "right" : "left";
      setSwipeState({
        id: reminderId,
        direction,
        offset: Math.min(Math.abs(diffX), 120), // Max 120px offset
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, reminder: Reminder) => {
    const { id, direction, offset } = swipeState;

    if (id === reminder.id && offset > 80) {
      triggerHaptic("medium");

      if (direction === "right") {
        // Right swipe = Complete
        onComplete(reminder.id, reminder.interval);
        toast({
          title: t("completed", { ns: "reminders" }),
          description: `${reminder.title} - ${reminder.plantName}`,
        });
      } else if (direction === "left") {
        // Left swipe = Snooze 1 hour
        onSnooze(reminder.id, 1);
        toast({
          title: t("snoozed", { ns: "reminders" }),
          description: t("snoozedFor", { ns: "reminders", hours: "1" }),
        });
      }
    }

    // Reset swipe state
    setSwipeState({ id: "", direction: null, offset: 0 });
    touchStartX.current = 0;
    touchStartY.current = 0;
  };

  const handleSnoozeClick = async (reminder: Reminder, hours: number) => {
    try {
      triggerHaptic("light");
      onSnooze(reminder.id, hours);
      toast({
        title: t("snoozed", { ns: "reminders" }),
        description: t("snoozedFor", {
          ns: "reminders",
          hours: hours.toString(),
        }),
      });
    } catch (error: any) {
      handleFirebaseError(error, "snoozing reminder");
    }
  };

  const handleCompleteClick = async (reminder: Reminder) => {
    try {
      triggerHaptic("success");
      onComplete(reminder.id, reminder.interval);
      toast({
        title: t("completed", { ns: "reminders" }),
        description: `${reminder.title} - ${reminder.plantName}`,
      });
    } catch (error: any) {
      handleFirebaseError(error, "completing reminder");
    }
  };

  const handleDeleteClick = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setShowDeleteDialog(true);
    triggerHaptic("warning");
  };

  const confirmDelete = () => {
    if (selectedReminder) {
      onDelete(selectedReminder.id);
      toast({
        title: t("deleted", { ns: "reminders" }),
        description: `${selectedReminder.title} - ${selectedReminder.plantName}`,
      });
    }
    setShowDeleteDialog(false);
    setSelectedReminder(null);
  };

  if (reminders.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">
          {t("noReminders", { ns: "reminders" })}
        </p>
        <p className="text-sm">{t("noRemindersDesc", { ns: "reminders" })}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Overdue Reminders */}
      {overdueReminders.map((reminder) => (
        <Card
          key={reminder.id}
          ref={cardRef}
          className={cn(
            "relative overflow-hidden border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 transition-transform",
            swipeState.id === reminder.id && "transform-gpu",
            swipeState.id === reminder.id &&
              swipeState.direction === "right" &&
              "translate-x-2",
            swipeState.id === reminder.id &&
              swipeState.direction === "left" &&
              "-translate-x-2"
          )}
          onTouchStart={(e) => handleTouchStart(e, reminder.id)}
          onTouchMove={(e) => handleTouchMove(e, reminder.id)}
          onTouchEnd={(e) => handleTouchEnd(e, reminder)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                {getReminderIcon(reminder.type)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-red-800 dark:text-red-200 truncate">
                    {reminder.title}
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-300 truncate">
                    {reminder.plantName} • {reminder.interval}{" "}
                    {t("days", { ns: "reminders" })}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(reminder)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    {t("edit", { ns: "common" })}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteClick(reminder)}>
                    <X className="mr-2 h-4 w-4" />
                    {t("delete", { ns: "common" })}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center justify-between mb-3">
              <Badge variant="destructive" className="text-xs">
                {formatTimeUntilDue(reminder.nextReminder)}
              </Badge>
              <Badge
                className={cn("text-xs", getReminderTypeColor(reminder.type))}
              >
                {t(`logType.${reminder.type}`, { ns: "journal" })}
              </Badge>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSnoozeClick(reminder, 1)}
                className="flex-1 min-h-[44px] text-xs"
              >
                <Clock className="mr-1 h-3 w-3" />
                {t("snooze1h", { ns: "reminders" })}
              </Button>
              <Button
                size="sm"
                onClick={() => handleCompleteClick(reminder)}
                className="flex-1 min-h-[44px] text-xs bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                {t("markDone", { ns: "reminders" })}
              </Button>
            </div>

            {/* Swipe hint */}
            <p className="text-xs text-red-500 dark:text-red-400 mt-2 text-center">
              {t("swipeHint", { ns: "reminders" })}
            </p>
          </CardContent>
        </Card>
      ))}

      {/* Due Soon Reminders */}
      {dueSoonReminders.map((reminder) => (
        <Card
          key={reminder.id}
          className={cn(
            "relative overflow-hidden border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 transition-transform",
            swipeState.id === reminder.id && "transform-gpu",
            swipeState.id === reminder.id &&
              swipeState.direction === "right" &&
              "translate-x-2",
            swipeState.id === reminder.id &&
              swipeState.direction === "left" &&
              "-translate-x-2"
          )}
          onTouchStart={(e) => handleTouchStart(e, reminder.id)}
          onTouchMove={(e) => handleTouchMove(e, reminder.id)}
          onTouchEnd={(e) => handleTouchEnd(e, reminder)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                {getReminderIcon(reminder.type)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200 truncate">
                    {reminder.title}
                  </h3>
                  <p className="text-sm text-amber-600 dark:text-amber-300 truncate">
                    {reminder.plantName} • {reminder.interval}{" "}
                    {t("days", { ns: "reminders" })}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(reminder)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    {t("edit", { ns: "common" })}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteClick(reminder)}>
                    <X className="mr-2 h-4 w-4" />
                    {t("delete", { ns: "common" })}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center justify-between mb-3">
              <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {formatTimeUntilDue(reminder.nextReminder)}
              </Badge>
              <Badge
                className={cn("text-xs", getReminderTypeColor(reminder.type))}
              >
                {t(`logType.${reminder.type}`, { ns: "journal" })}
              </Badge>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSnoozeClick(reminder, 2)}
                className="flex-1 min-h-[44px] text-xs"
              >
                <Clock className="mr-1 h-3 w-3" />
                {t("snooze2h", { ns: "reminders" })}
              </Button>
              <Button
                size="sm"
                onClick={() => handleCompleteClick(reminder)}
                className="flex-1 min-h-[44px] text-xs"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                {t("markDone", { ns: "reminders" })}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Regular Active Reminders */}
      {reminders
        .filter((r) => {
          const next = new Date(r.nextReminder);
          return r.isActive && next > dueSoonThreshold;
        })
        .map((reminder) => (
          <Card
            key={reminder.id}
            className="border-gray-200 dark:border-gray-800"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  {getReminderIcon(reminder.type)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{reminder.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {reminder.plantName} • {reminder.interval}{" "}
                      {t("days", { ns: "reminders" })}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(reminder)}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {t("edit", { ns: "common" })}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(reminder)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      {t("delete", { ns: "common" })}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {formatTimeUntilDue(reminder.nextReminder)}
                </Badge>
                <Badge
                  className={cn("text-xs", getReminderTypeColor(reminder.type))}
                >
                  {t(`logType.${reminder.type}`, { ns: "journal" })}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteReminder", { ns: "reminders" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteReminderConfirm", { ns: "reminders" })}
              {selectedReminder && ` "${selectedReminder.title}"`}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("cancel", { ns: "common" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete", { ns: "common" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
