"use client";

import type { ReminderSystemProps } from "@/types/plants";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { auth, db } from "@/lib/firebase";
import { deleteDoc, doc, getDocs, query, updateDoc } from "firebase/firestore";
import { remindersCol } from "@/lib/paths";
import {
  invalidateDashboardCache,
  invalidateRemindersCache,
} from "@/lib/suspense-cache";
import { Bell, AlarmClock, X, Calendar, Leaf } from "lucide-react";
import { EditReminderDialog } from "@/components/common/edit-reminder-dialog";
import { EmptyState } from "@/components/common/empty-state";
import type { Reminder } from "@/types";
import { getNextAlarmOccurrence } from "@/lib/alarm-schedule";

export function ReminderSystem({
  plants,
  reminders: preFetchedReminders,
}: ReminderSystemProps) {
  const { t, i18n } = useTranslation(["reminders", "common"]);
  const { handleFirebaseError } = useErrorHandler();
  const [reminders, setReminders] = useState<Reminder[]>(
    preFetchedReminders || []
  );
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

    } catch (error: any) {
      handleFirebaseError(error, "deleting reminder");
    }
  };

  const getNextOccurrence = (reminder: Reminder): number | null => {
    if (!Array.isArray(reminder.daysOfWeek) || !reminder.timeOfDay) return null;
    return getNextAlarmOccurrence(reminder.daysOfWeek, reminder.timeOfDay);
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


  return (
    <div className="space-y-6">
      {/* Reminders List */}
      <div>
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
                className={`group relative overflow-hidden transition-[opacity,filter,box-shadow] duration-300 ${
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
