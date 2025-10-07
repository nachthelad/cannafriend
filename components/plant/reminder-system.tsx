"use client";

import { useState, useEffect } from "react";
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
import {
  collection,
  addDoc,
  query,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { invalidateDashboardCache, invalidateRemindersCache } from "@/lib/suspense-cache";
import {
  Bell,
  Clock,
  Droplet,
  Leaf,
  Scissors,
  Edit,
  X,
} from "lucide-react";
import { EditReminderDialog } from "@/components/common/edit-reminder-dialog";
import type { Plant, Reminder } from "@/types";

interface ReminderSystemProps {
  plants: Plant[];
  // When true, render only the overdue card (if any). Used on dashboard.
  showOnlyOverdue?: boolean;
  // Pre-fetched reminders to avoid loading state
  reminders?: Reminder[];
}

export function ReminderSystem({
  plants,
  showOnlyOverdue = false,
  reminders: preFetchedReminders,
}: ReminderSystemProps) {
  const { t } = useTranslation(["reminders", "common", "journal"]);
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

  // Mark as done: move nextReminder by interval days and update lastReminder to now
  const handleMarkDone = async (reminderId: string, intervalDays: number) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const now = new Date();
      const next = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      const reminderRef = doc(
        db,
        "users",
        currentUser.uid,
        "reminders",
        reminderId
      );
      await updateDoc(reminderRef, {
        lastReminder: now.toISOString(),
        nextReminder: next.toISOString(),
      });
      setReminders((prev) =>
        prev.map((r) =>
          r.id === reminderId
            ? {
                ...r,
                lastReminder: now.toISOString(),
                nextReminder: next.toISOString(),
              }
            : r
        )
      );
      invalidateRemindersCache(currentUser.uid);
      invalidateDashboardCache(currentUser.uid);
      toast({ title: t("updated", { ns: "reminders" }) });
    } catch (error: any) {
      handleFirebaseError(error, "marking reminder done");
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

  const getReminderIcon = (type: Reminder["type"]) => {
    switch (type) {
      case "watering":
        return <Droplet className="h-4 w-4 text-blue-500" />;
      case "feeding":
        return <Leaf className="h-4 w-4 text-green-500" />;
      case "training":
        return <Scissors className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const activeReminders = reminders.filter((r) => r.isActive);
  const now = new Date();
  const overdueReminders = activeReminders.filter(
    (r) => new Date(r.nextReminder) < now
  );
  const dueSoonThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dueSoonReminders = activeReminders.filter((r) => {
    const next = new Date(r.nextReminder);
    return next >= now && next <= dueSoonThreshold;
  });

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
    // Render only the overdue card if there are overdue reminders; otherwise render nothing
    if (overdueReminders.length === 0) return null;
    return (
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardHeader>
          <CardTitle className="text-orange-800 dark:text-orange-200">
            {t("overdue", { ns: "reminders" })} ({overdueReminders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {overdueReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md"
            >
              <div className="flex items-center gap-3">
                {getReminderIcon(reminder.type)}
                <div>
                  <div className="font-medium">{reminder.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {reminder.plantName}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">
                  {t("overdue", { ns: "reminders" })}
                </Badge>
                <Button
                  size="sm"
                  onClick={() => handleMarkDone(reminder.id, reminder.interval)}
                >
                  {t("markDone", { ns: "reminders" })}
                </Button>
              </div>
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
              {t("overdueDesc", { ns: "reminders" })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md"
              >
                <div className="flex items-center gap-3">
                  {getReminderIcon(reminder.type)}
                  <div>
                    <div className="font-medium">{reminder.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {reminder.plantName}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    {t("overdue", { ns: "reminders" })}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleMarkDone(reminder.id, reminder.interval)
                    }
                  >
                    {t("markDone", { ns: "reminders" })}
                  </Button>
                </div>
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
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("noReminders", { ns: "reminders" })}</p>
              <p className="text-sm">
                {t("noRemindersDesc", { ns: "reminders" })}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getReminderIcon(reminder.type)}
                    <div>
                      <div className="font-medium">{reminder.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {reminder.plantName} • {reminder.interval}{" "}
                        {t("days", { ns: "reminders" })}
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
