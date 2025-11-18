"use client";

import type { ReminderSystemProps } from "@/types/plants";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { auth, db } from "@/lib/firebase";
import { remindersCol } from "@/lib/paths";
import { query, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { invalidateDashboardCache, invalidateRemindersCache } from "@/lib/suspense-cache";
import {
  Bell,
  AlarmClock,
  Edit,
  X,
} from "lucide-react";
import { EditReminderDialog } from "@/components/common/edit-reminder-dialog";
import type { Reminder } from "@/types";

export function ReminderSystem({
  plants,
  showOnlyOverdue = false,
  reminders: preFetchedReminders,
}: ReminderSystemProps) {
  const { t, i18n } = useTranslation(["reminders", "common"]);
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();
  const [reminders, setReminders] = useState<Reminder[]>(
    preFetchedReminders || []
  );
  const [isLoading, setIsLoading] = useState(!preFetchedReminders);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (preFetchedReminders) {
      setReminders(preFetchedReminders);
      setIsLoading(false);
      return;
    }
    fetchReminders();
  }, [preFetchedReminders]);

  const fetchReminders = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const remindersRef = remindersCol(currentUser.uid);
      const q = query(remindersRef);
      const querySnapshot = await getDocs(q);

      const remindersData: Reminder[] = [];
      querySnapshot.forEach((doc) => {
        remindersData.push({ id: doc.id, ...doc.data() } as Reminder);
      });

      setReminders(remindersData);
    } catch (error: any) {
      handleFirebaseError(error, "fetching reminders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleReminder = async (
    reminderId: string,
    isActive: boolean
  ) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const reminderRef = doc(
        db,
        "users",
        currentUser.uid,
        "reminders",
        reminderId
      );
      await updateDoc(reminderRef, { isActive });

      setReminders(
        reminders.map((r) => (r.id === reminderId ? { ...r, isActive } : r))
      );

      invalidateRemindersCache(currentUser.uid);
      invalidateDashboardCache(currentUser.uid);

      toast({
        title: t("updated", { ns: "reminders" }),
        description: isActive
          ? t("activated", { ns: "reminders" })
          : t("deactivated", { ns: "reminders" }),
      });
    } catch (error: any) {
      handleFirebaseError(error, "updating reminder");
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsEditDialogOpen(true);
  };

  const handleReminderUpdated = () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      invalidateRemindersCache(currentUser.uid);
      invalidateDashboardCache(currentUser.uid);
    }
    fetchReminders(); // Refresh the reminders list
  };

  const handleDeleteReminder = async (reminderId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const reminderRef = doc(
        db,
        "users",
        currentUser.uid,
        "reminders",
        reminderId
      );
      await deleteDoc(reminderRef);

      setReminders(reminders.filter((r) => r.id !== reminderId));

      invalidateRemindersCache(currentUser.uid);
      invalidateDashboardCache(currentUser.uid);

      toast({
        title: t("deleted", { ns: "reminders" }),
        description: t("deletedMessage", { ns: "reminders" }),
      });
    } catch (error: any) {
      handleFirebaseError(error, "deleting reminder");
    }
  };

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

  const normalizedReminders = reminders
    .map((r) => ({
      ...r,
      nextOccurrence: getNextOccurrence(r),
    }))
    .sort((a, b) => {
      if (a.nextOccurrence === null) return 1;
      if (b.nextOccurrence === null) return -1;
      return a.nextOccurrence - b.nextOccurrence;
    });

  const activeReminders = normalizedReminders.filter((r) => r.isActive);
  const now = Date.now();
  const overdueReminders = activeReminders.filter(
    (r) => r.nextOccurrence !== null && r.nextOccurrence <= now
  );
  const dueSoonReminders = activeReminders.filter((r) => {
    if (!r.nextOccurrence) return false;
    const diff = r.nextOccurrence - now;
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  });

  const dayLabels = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, idx) =>
        new Intl.DateTimeFormat(i18n.language, { weekday: "short" }).format(
          new Date(2024, 0, 7 + idx)
        )
      ),
    [i18n.language]
  );

  const formatSchedule = (reminder: Reminder) => {
    if (!Array.isArray(reminder.daysOfWeek) || !reminder.timeOfDay) {
      return t("noSchedule", { ns: "reminders" });
    }
    const days = reminder.daysOfWeek
      .slice()
      .sort()
      .map((d) => dayLabels[d])
      .join(", ");
    return `${days} • ${reminder.timeOfDay}`;
  };

  const [overdueToastShown, setOverdueToastShown] = useState(false);
  useEffect(() => {
    if (showOnlyOverdue) return; // avoid toast on dashboard
    if (!overdueToastShown && overdueReminders.length > 0) {
      toast({
        title: t("overdue", { ns: "reminders" }),
        description: `${overdueReminders.length} ${t("overdue", {
          ns: "reminders",
        })}`,
      });
      setOverdueToastShown(true);
    }
  }, [overdueReminders.length, overdueToastShown, t, toast, showOnlyOverdue]);

  if (isLoading) {
    return <ReminderSystemSkeleton showOnlyOverdue={showOnlyOverdue} />;
  }

  if (showOnlyOverdue) {
    if (overdueReminders.length === 0) return null;
    return (
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardHeader>
          <CardTitle className="text-orange-800 dark:text-orange-200">
            {t("overdue", { ns: "reminders" })} ({overdueReminders.length})
          </CardTitle>
          <CardDescription>
            {t("overdueDesc", { ns: "reminders", defaultValue: "These alarms are past their scheduled time." })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {overdueReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md"
            >
              <div className="flex items-center gap-3">
                <AlarmClock className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">
                    {reminder.label ||
                      reminder.title ||
                      t("untitled", { ns: "common", defaultValue: "Untitled" })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {reminder.plantName && `${reminder.plantName} • `}
                    {formatSchedule(reminder)}
                  </div>
                </div>
              </div>
              <Badge variant="destructive">
                {t("overdue", { ns: "reminders" })}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overdue Reminders */}
      {overdueReminders.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-200">
              {t("overdue", { ns: "reminders" })} ({overdueReminders.length})
            </CardTitle>
            <CardDescription className="text-orange-600 dark:text-orange-300">
              {t("overdueDesc", {
                ns: "reminders",
                defaultValue: "These alarms are past their scheduled time.",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <AlarmClock className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium">
                      {reminder.label ||
                        reminder.title ||
                        t("untitled", { ns: "common", defaultValue: "Untitled" })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {reminder.plantName && `${reminder.plantName} • `}
                      {formatSchedule(reminder)}
                    </div>
                  </div>
                </div>
                <Badge variant="destructive">
                  {t("overdue", { ns: "reminders" })}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reminders List */}
      <div>
        <div className="flex items-center justify-between">
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
        </div>
        <div>
          {normalizedReminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("noReminders", { ns: "reminders" })}</p>
              <p className="text-sm">
                {t("noRemindersDesc", { ns: "reminders" })}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {normalizedReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <AlarmClock className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">
                        {reminder.label ||
                          reminder.title ||
                          t("untitled", { ns: "common", defaultValue: "Untitled" })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {reminder.plantName && `${reminder.plantName} • `}
                        {Array.isArray(reminder.daysOfWeek) && reminder.timeOfDay
                          ? `${reminder.daysOfWeek
                              .slice()
                              .sort()
                              .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
                              .join(", ")} • ${reminder.timeOfDay}`
                          : t("noSchedule", {
                              ns: "reminders",
                              defaultValue: "No schedule",
                            })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={reminder.isActive}
                      onCheckedChange={(checked) =>
                        handleToggleReminder(reminder.id, checked)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditReminder(reminder)}
                      title={t("edit", { ns: "common" })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReminder(reminder.id)}
                      title={t("delete", { ns: "common" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Reminder Dialog */}
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

function ReminderSystemSkeleton({
  showOnlyOverdue,
}: {
  showOnlyOverdue: boolean;
}) {
  if (showOnlyOverdue) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
