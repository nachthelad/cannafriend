"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlarmClock, Bell, Check, Clock, Edit, MoreVertical, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { useTranslation } from "react-i18next";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { remindersCol } from "@/lib/paths";
import { Reminder, Plant } from "@/types";
import { cn, formatDateWithLocale } from "@/lib/utils";
import { deleteDoc, doc, onSnapshot, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { invalidateDashboardCache, invalidateRemindersCache } from "@/lib/suspense-cache";
import { EditReminderDialog } from "@/components/common/edit-reminder-dialog";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_HOURS = 24;

const normalizeDateValue = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return "";
    }
  }
  return "";
};

const normalizeReminder = (reminder: Reminder): Reminder => ({
  ...reminder,
  interval: Number(reminder.interval),
  lastReminder: normalizeDateValue(reminder.lastReminder),
  nextReminder: normalizeDateValue(reminder.nextReminder),
});

const getTimeValue = (value: string) => {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const isReminderOverdue = (reminder: Reminder) => {
  if (!reminder.isActive) return false;
  const nextTime = getTimeValue(reminder.nextReminder);
  if (!nextTime) return false;
  return nextTime <= Date.now();
};

const hoursUntilReminder = (reminder: Reminder) => {
  const nextTime = getTimeValue(reminder.nextReminder);
  if (!nextTime) return Number.POSITIVE_INFINITY;
  return (nextTime - Date.now()) / (60 * 60 * 1000);
};

interface MobileRemindersProps {
  userId: string;
  plants: Plant[];
  initialReminders: Reminder[];
}

interface MobileReminderItemProps {
  reminder: Reminder;
  language: string;
  isProcessing: boolean;
  onMarkDone: (reminder: Reminder) => Promise<void>;
  onSnooze: (reminder: Reminder, hours: number) => Promise<void>;
  onToggleActive: (reminder: Reminder, isActive: boolean) => Promise<void>;
  onEdit: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => Promise<void>;
}

export function MobileReminders({
  userId,
  plants,
  initialReminders,
}: MobileRemindersProps) {
  const { t, i18n } = useTranslation(["reminders", "common"]);
  const { handleFirebaseError } = useErrorHandler();
  const [reminders, setReminders] = useState<Reminder[]>(
    initialReminders.map(normalizeReminder)
  );
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Keep local state aligned when Suspense provides new data
  useEffect(() => {
    setReminders(initialReminders.map(normalizeReminder));
  }, [initialReminders]);

  // Subscribe to realtime updates so the list stays fresh while open
  useEffect(() => {
    const remindersQuery = query(remindersCol(userId));
    const unsubscribe = onSnapshot(
      remindersQuery,
      (snapshot) => {
        const snapshotReminders = snapshot.docs.map((docSnapshot) =>
          normalizeReminder(
            {
              id: docSnapshot.id,
              ...docSnapshot.data(),
            } as Reminder
          )
        );

        snapshotReminders.sort((a, b) => {
          const aTime = new Date(a.nextReminder).getTime();
          const bTime = new Date(b.nextReminder).getTime();
          return aTime - bTime;
        });

        setReminders(snapshotReminders);
      },
      (error) => handleFirebaseError(error, "subscribing to reminders")
    );

    return () => unsubscribe();
  }, [handleFirebaseError, userId]);

  const sortedReminders = useMemo(() => {
    return reminders.slice().sort((a, b) => {
      const aTime = getTimeValue(a.nextReminder);
      const bTime = getTimeValue(b.nextReminder);
      return aTime - bTime;
    });
  }, [reminders]);

  const hasOverdueReminders = useMemo(
    () => sortedReminders.some(isReminderOverdue),
    [sortedReminders]
  );

  const handleMarkDone = useCallback(
    async (reminder: Reminder) => {
      if (!isReminderOverdue(reminder)) {
        return;
      }

      if (processingId) return;
      setProcessingId(reminder.id);
      try {
        const intervalDays = Number(reminder.interval) || 0;
        const completionMoment = new Date();
        const baseTimeCandidate = getTimeValue(reminder.nextReminder);
        const baseTime = Math.max(
          completionMoment.getTime(),
          baseTimeCandidate || completionMoment.getTime()
        );
        const next = new Date(baseTime + intervalDays * DAY_IN_MS);

        const reminderRef = doc(
          db,
          "users",
          userId,
          "reminders",
          reminder.id
        );
        await updateDoc(reminderRef, {
          lastReminder: completionMoment.toISOString(),
          nextReminder: next.toISOString(),
        });

        setReminders((prev) =>
          prev.map((item) =>
            item.id === reminder.id
              ? {
                  ...item,
                  lastReminder: completionMoment.toISOString(),
                  nextReminder: next.toISOString(),
                }
              : item
          )
        );

        invalidateRemindersCache(userId);
        invalidateDashboardCache(userId);
      } catch (error) {
        handleFirebaseError(error, "marking reminder done");
      } finally {
        setProcessingId(null);
      }
    },
    [getTimeValue, handleFirebaseError, processingId, t, , userId]
  );

  const handleSnooze = useCallback(
    async (reminder: Reminder, hours: number) => {
      if (processingId) return;
      setProcessingId(reminder.id);

      try {
        const baseFromReminder = getTimeValue(reminder.nextReminder);
        const base = new Date(
          Math.max(baseFromReminder || Date.now(), Date.now())
        );
        const next = new Date(base.getTime() + hours * 60 * 60 * 1000);

        const reminderRef = doc(
          db,
          "users",
          userId,
          "reminders",
          reminder.id
        );
        await updateDoc(reminderRef, {
          nextReminder: next.toISOString(),
        });

        setReminders((prev) =>
          prev.map((item) =>
            item.id === reminder.id
              ? {
                  ...item,
                  nextReminder: next.toISOString(),
                }
              : item
          )
        );

        invalidateRemindersCache(userId);
        invalidateDashboardCache(userId);
      } catch (error) {
        handleFirebaseError(error, "snoozing reminder");
      } finally {
        setProcessingId(null);
      }
    },
    [getTimeValue, handleFirebaseError, processingId, t, , userId]
  );

  const handleToggleActive = useCallback(
    async (reminder: Reminder, isActive: boolean) => {
      if (processingId) return;
      setProcessingId(reminder.id);

      try {
        const reminderRef = doc(
          db,
          "users",
          userId,
          "reminders",
          reminder.id
        );
        await updateDoc(reminderRef, { isActive });

        setReminders((prev) =>
          prev.map((item) =>
            item.id === reminder.id
              ? {
                  ...item,
                  isActive,
                }
              : item
          )
        );

        invalidateRemindersCache(userId);
        invalidateDashboardCache(userId);
      } catch (error) {
        handleFirebaseError(error, "updating reminder");
      } finally {
        setProcessingId(null);
      }
    },
    [handleFirebaseError, processingId, t, , userId]
  );

  const handleDelete = useCallback(
    async (reminder: Reminder) => {
      if (processingId) return;
      setProcessingId(reminder.id);

      try {
        const reminderRef = doc(
          db,
          "users",
          userId,
          "reminders",
          reminder.id
        );
        await deleteDoc(reminderRef);

        setReminders((prev) => prev.filter((item) => item.id !== reminder.id));

        invalidateRemindersCache(userId);
        invalidateDashboardCache(userId);
      } catch (error) {
        handleFirebaseError(error, "deleting reminder");
      } finally {
        setProcessingId(null);
      }
    },
    [handleFirebaseError, processingId, t, , userId]
  );

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsEditDialogOpen(true);
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingReminder(null);
    }
  };

  const handleReminderUpdated = () => {
    invalidateRemindersCache(userId);
    invalidateDashboardCache(userId);
  };

  return (
    <div className="space-y-4">
      {sortedReminders.length === 0 ? (
        <Card className="py-10 text-center">
          <CardContent className="space-y-2">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="font-medium">{t("noReminders", { ns: "reminders" })}</p>
            <p className="text-sm text-muted-foreground">
              {t("swipeHint", { ns: "reminders" })}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {hasOverdueReminders && (
            <div className="rounded-lg bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              {t("swipeHint", { ns: "reminders" })}
            </div>
          )}
          <div className="space-y-4">
            {sortedReminders.map((reminder) => (
              <MobileReminderItem
                key={reminder.id}
                reminder={reminder}
                language={i18n.language}
                isProcessing={processingId === reminder.id}
                onMarkDone={handleMarkDone}
                onSnooze={handleSnooze}
                onToggleActive={handleToggleActive}
                onEdit={handleEditReminder}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      <EditReminderDialog
        reminder={editingReminder}
        plants={plants}
        isOpen={isEditDialogOpen}
        onOpenChange={handleEditDialogChange}
        onReminderUpdated={handleReminderUpdated}
      />
    </div>
  );
}

function MobileReminderItem({
  reminder,
  language,
  isProcessing,
  onMarkDone,
  onSnooze,
  onToggleActive,
  onEdit,
  onDelete,
}: MobileReminderItemProps) {
  const { t } = useTranslation(["reminders", "common"]);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const maxSwipeDistance = 120;
  const actionThreshold = 80;

  const isOverdue = isReminderOverdue(reminder);
  const nextReminderTime = getTimeValue(reminder.nextReminder);
  const nextReminderDate =
    nextReminderTime > 0 ? new Date(nextReminderTime) : null;
  const hoursUntilDue = hoursUntilReminder(reminder);
  const isDueSoon =
    reminder.isActive &&
    !isOverdue &&
    Number.isFinite(hoursUntilDue) &&
    hoursUntilDue <= DUE_SOON_HOURS;

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isProcessing || !isOverdue) return;
    const touch = event.touches[0];
    setStartX(touch.clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || isProcessing || !isOverdue) return;
    const touch = event.touches[0];
    const delta = touch.clientX - startX;
    const constrainedDelta = Math.max(
      -maxSwipeDistance,
      Math.min(maxSwipeDistance, delta)
    );
    setTranslateX(constrainedDelta);
  };

  const handleTouchEnd = async () => {
    if (!isDragging || isProcessing || !isOverdue) {
      setTranslateX(0);
      setIsDragging(false);
      return;
    }

    if (translateX > actionThreshold) {
      await onMarkDone(reminder);
    } else if (translateX < -actionThreshold) {
      await onSnooze(reminder, 1);
    }

    setTranslateX(0);
    setIsDragging(false);
  };

  const handleSnoozeOneHour = () => onSnooze(reminder, 1);
  const handleSnoozeTwoHours = () => onSnooze(reminder, 2);
  const handleMarkDoneClick = () => {
    if (isOverdue) {
      onMarkDone(reminder);
    }
  };
  const handleToggle = (checked: boolean) => onToggleActive(reminder, checked);
  const handleDeleteReminder = () => onDelete(reminder);
  const handleEditReminder = () => onEdit(reminder);

  const nextReminderLabel =
    nextReminderDate !== null
      ? formatDateWithLocale(
          nextReminderDate.toISOString(),
          "MMM d, HH:mm",
          language
        )
      : t("pending", { ns: "common" });

  useEffect(() => {
    if (!isOverdue) {
      setTranslateX(0);
      setIsDragging(false);
    }
  }, [isOverdue]);

  return (
    <>
      <div className="relative">
        {isOverdue && (
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <Check className="h-5 w-5" />
              <span className="text-sm font-medium">
                {t("markDone", { ns: "reminders" })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <AlarmClock className="h-5 w-5" />
              <span className="text-sm font-medium">
                {t("snooze1h", { ns: "reminders" })}
              </span>
            </div>
          </div>
        )}

        <Card
          className={cn(
            "relative z-10 transition-transform duration-200 ease-out",
            isProcessing && "opacity-70"
          )}
          style={{ transform: `translateX(${translateX}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {reminder.plantName}
                  </Badge>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      {t("overdue", { ns: "reminders" })}
                    </Badge>
                  )}
                  {isDueSoon && (
                    <Badge className="text-xs">
                      {t("dueSoon", { ns: "reminders" })}
                    </Badge>
                  )}
                </div>
                <p className="text-base font-semibold">{reminder.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{nextReminderLabel}</span>
                  <span className="text-muted-foreground">|</span>
                  <span>
                    {t("every", { ns: "reminders" })} {reminder.interval}{" "}
                    {t("days", { ns: "reminders" })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Switch
                  checked={reminder.isActive}
                  onCheckedChange={handleToggle}
                  disabled={isProcessing}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isProcessing}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={handleEditReminder}>
                      <Edit className="mr-2 h-4 w-4" />
                      {t("edit", { ns: "common" })}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setShowDeleteDialog(true)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("delete", { ns: "common" })}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSnoozeOneHour}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <AlarmClock className="h-4 w-4" />
                {t("snooze1h", { ns: "reminders" })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSnoozeTwoHours}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <AlarmClock className="h-4 w-4" />
                {t("snooze2h", { ns: "reminders" })}
              </Button>
              <Button
                size="sm"
                onClick={handleMarkDoneClick}
                disabled={isProcessing || !isOverdue}
                className="col-span-2 flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                {t("markDone", { ns: "reminders" })}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteReminder", { ns: "reminders" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteReminderConfirm", { ns: "reminders" })}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              {t("cancel", { ns: "common" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReminder}
              className="bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
            >
              {t("delete", { ns: "common" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
