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
import {
  invalidateDashboardCache,
  invalidateRemindersCache,
} from "@/lib/suspense-cache";
import { Bell, AlarmClock, Edit, X, Calendar, Leaf } from "lucide-react";
import { EditReminderDialog } from "@/components/common/edit-reminder-dialog";
import { EmptyState } from "@/components/common/empty-state";
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
    return days;
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
      <Card className="border-warning/50 bg-warning/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-warning-foreground">
            <AlarmClock className="h-5 w-5" />
            <CardTitle className="text-lg">
              {t("overdue", { ns: "reminders" })} ({overdueReminders.length})
            </CardTitle>
          </div>
          <CardDescription>
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
              className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-warning/20"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center text-warning-foreground">
                  <AlarmClock className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">
                    {reminder.label ||
                      reminder.title ||
                      t("untitled", { ns: "common", defaultValue: "Untitled" })}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    {reminder.plantName && (
                      <>
                        <span className="font-medium text-foreground/80">
                          {reminder.plantName}
                        </span>
                        <span>•</span>
                      </>
                    )}
                    <span>{reminder.timeOfDay}</span>
                  </div>
                </div>
              </div>
              <Badge variant="warning">
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
        <Card className="border-warning/50 bg-warning/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-warning-foreground">
              <AlarmClock className="h-5 w-5" />
              <CardTitle className="text-lg">
                {t("overdue", { ns: "reminders" })} ({overdueReminders.length})
              </CardTitle>
            </div>
            <CardDescription>
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
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-warning/20"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center text-warning-foreground">
                    <AlarmClock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {reminder.label ||
                        reminder.title ||
                        t("untitled", {
                          ns: "common",
                          defaultValue: "Untitled",
                        })}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      {reminder.plantName && (
                        <>
                          <span className="font-medium text-foreground/80">
                            {reminder.plantName}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span>{reminder.timeOfDay}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="warning">
                  {t("overdue", { ns: "reminders" })}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reminders List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {dueSoonReminders.length > 0 && (
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20"
              >
                {t("dueSoon", { ns: "reminders" })} {dueSoonReminders.length}
              </Badge>
            )}
          </div>
        </div>

        {normalizedReminders.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={t("noReminders", { ns: "reminders" })}
            description={t("noRemindersDesc", { ns: "reminders" })}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {normalizedReminders.map((reminder) => (
              <Card
                key={reminder.id}
                variant="interactive"
                className={`group relative overflow-hidden transition-all duration-300 ${
                  !reminder.isActive ? "opacity-75 grayscale-[0.5]" : ""
                }`}
              >
                <div className="absolute top-3 right-3 z-10">
                  <Switch
                    checked={reminder.isActive}
                    onCheckedChange={(checked) =>
                      handleToggleReminder(reminder.id, checked)
                    }
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                <div
                  className="p-5 h-full flex flex-col"
                  onClick={() => handleEditReminder(reminder)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <AlarmClock className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="space-y-1 mb-4 flex-1">
                    <h3 className="text-2xl font-bold tracking-tight">
                      {reminder.timeOfDay}
                    </h3>
                    <p className="font-medium text-foreground/90 truncate">
                      {reminder.label ||
                        reminder.title ||
                        t("untitled", { ns: "common" })}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border/50">
                    {reminder.plantName && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Leaf className="h-3.5 w-3.5" />
                        <span className="truncate">{reminder.plantName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="truncate">
                        {formatSchedule(reminder)}
                      </span>
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReminder(reminder.id);
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
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
      <Card className="border-warning/50 bg-warning/10">
        <CardHeader className="pb-3">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-48">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="pt-4 border-t">
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
