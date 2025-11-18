"use client";

import type { MobileRemindersProps, MobileReminderItemProps } from "@/types/mobile";
import { useEffect, useMemo, useState } from "react";
import { AlarmClock, Bell, Edit, MoreVertical, Trash2 } from "lucide-react";
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
import { deleteDoc, doc, onSnapshot, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { invalidateDashboardCache, invalidateRemindersCache } from "@/lib/suspense-cache";
import { EditReminderDialog } from "@/components/common/edit-reminder-dialog";

const getNextOccurrence = (reminder: Reminder): number | null => {
  if (!Array.isArray(reminder.daysOfWeek) || !reminder.timeOfDay) return null;
  const [hours, minutes] = String(reminder.timeOfDay)
    .split(":")
    .map((v) => parseInt(v, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const now = new Date();
  for (let offset = 0; offset < 7; offset++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    if (!reminder.daysOfWeek.includes(candidate.getDay())) continue;
    candidate.setHours(hours, minutes, 0, 0);
    if (candidate.getTime() >= now.getTime()) {
      return candidate.getTime();
    }
  }
  return null;
};

export function MobileReminders({
  userId,
  plants,
  initialReminders,
}: MobileRemindersProps) {
  const { t, i18n } = useTranslation(["reminders", "common"]);
  const { handleFirebaseError } = useErrorHandler();
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Subscribe to realtime updates so the list stays fresh while open
  useEffect(() => {
    const remindersQuery = query(remindersCol(userId));
    const unsubscribe = onSnapshot(
      remindersQuery,
      (snapshot) => {
        const snapshotReminders = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        })) as Reminder[];

        setReminders(
          snapshotReminders.sort((a, b) => {
            const aNext = getNextOccurrence(a);
            const bNext = getNextOccurrence(b);
            if (aNext === null) return 1;
            if (bNext === null) return -1;
            return aNext - bNext;
          })
        );
      },
      (error) => handleFirebaseError(error, "subscribing to reminders")
    );

    return () => unsubscribe();
  }, [handleFirebaseError, userId]);

  const enrichedReminders = useMemo(
    () =>
      reminders
        .map((reminder) => ({
          ...reminder,
          nextOccurrence: getNextOccurrence(reminder),
        }))
        .sort((a, b) => {
          if (a.nextOccurrence === null) return 1;
          if (b.nextOccurrence === null) return -1;
          return a.nextOccurrence - b.nextOccurrence;
        }),
    [reminders]
  );

  const overdueReminders = enrichedReminders.filter(
    (r) => r.isActive && r.nextOccurrence !== null && r.nextOccurrence <= Date.now()
  );
  const dueSoonReminders = enrichedReminders.filter((r) => {
    if (!r.nextOccurrence) return false;
    const diff = r.nextOccurrence - Date.now();
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  });

  const handleToggleActive = async (reminder: Reminder, isActive: boolean) => {
    if (processingId) return;
    setProcessingId(reminder.id);

    try {
      const reminderRef = doc(db, "users", userId, "reminders", reminder.id);
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
  };

  const handleDelete = async (reminder: Reminder) => {
    if (processingId) return;
    setProcessingId(reminder.id);
    try {
      const reminderRef = doc(db, "users", userId, "reminders", reminder.id);
      await deleteDoc(reminderRef);
      setReminders((prev) => prev.filter((item) => item.id !== reminder.id));
      invalidateRemindersCache(userId);
      invalidateDashboardCache(userId);
    } catch (error) {
      handleFirebaseError(error, "deleting reminder");
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsEditDialogOpen(true);
  };

  const handleReminderUpdated = () => {
    invalidateRemindersCache(userId);
    invalidateDashboardCache(userId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {overdueReminders.length > 0 && (
          <Badge variant="destructive">
            {t("overdue", { ns: "reminders" })} {overdueReminders.length}
          </Badge>
        )}
        {dueSoonReminders.length > 0 && (
          <Badge>
            {t("dueSoon", { ns: "reminders" })} {dueSoonReminders.length}
          </Badge>
        )}
      </div>

      {enrichedReminders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t("noReminders", { ns: "reminders" })}</p>
          <p className="text-sm">{t("noRemindersDesc", { ns: "reminders" })}</p>
        </div>
      ) : (
        enrichedReminders.map((reminder) => (
          <MobileReminderItem
            key={reminder.id}
            reminder={reminder}
            isProcessing={processingId === reminder.id}
            onToggleActive={handleToggleActive}
            onEdit={handleEditReminder}
            onDelete={handleDelete}
          />
        ))
      )}

      <EditReminderDialog
        reminder={editingReminder}
        plants={plants}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onReminderUpdated={handleReminderUpdated}
      />
    </div>
  );
}

function MobileReminderItem({
  reminder,
  isProcessing,
  onToggleActive,
  onEdit,
  onDelete,
}: MobileReminderItemProps) {
  const { t, i18n } = useTranslation(["reminders", "common"]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const dayLabels = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, idx) =>
        new Intl.DateTimeFormat(i18n.language, { weekday: "short" }).format(
          new Date(2024, 0, 7 + idx)
        )
      ),
    [i18n.language]
  );

  const schedule =
    Array.isArray(reminder.daysOfWeek) && reminder.timeOfDay
      ? `${reminder.daysOfWeek
          .slice()
          .sort()
          .map((d) => dayLabels[d])
          .join(", ")} • ${reminder.timeOfDay}`
      : t("noSchedule", { ns: "reminders" });
  const nextOccurrence = getNextOccurrence(reminder);
  const isOverdue =
    reminder.isActive && nextOccurrence !== null && nextOccurrence <= Date.now();

  const handleDelete = async () => {
    await onDelete(reminder);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlarmClock className="h-5 w-5 text-primary mt-1" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {reminder.label ||
                      reminder.title ||
                      t("untitled", { ns: "common", defaultValue: "Untitled" })}
                  </p>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-[10px]">
                      {t("overdue", { ns: "reminders" })}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{schedule}</p>
                {reminder.plantName && (
                  <p className="text-xs text-muted-foreground">
                    {reminder.plantName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={reminder.isActive}
                onCheckedChange={(value) => onToggleActive(reminder, value)}
                disabled={isProcessing}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onEdit(reminder)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t("edit", { ns: "common" })}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("delete", { ns: "common" })}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete", { ns: "common" })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteReminderConfirm", {
                ns: "reminders",
                defaultValue: "Are you sure you want to delete this reminder?",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel", { ns: "common" })}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("delete", { ns: "common" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
