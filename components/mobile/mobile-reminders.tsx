"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { plantsCol } from "@/lib/paths";
import { ROUTE_PLANTS_NEW } from "@/lib/routes";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { MobileReminderCards } from "./mobile-reminder-cards";
import { MobileReminderScheduler } from "./mobile-reminder-scheduler";
import { EditReminderDialog } from "@/components/common/edit-reminder-dialog";
import { Bell, Plus, TrendingUp } from "lucide-react";
import type { Plant } from "@/types";

interface Reminder {
  id: string;
  plantId: string;
  plantName: string;
  type: "watering" | "feeding" | "training" | "custom";
  title: string;
  description: string;
  interval: number;
  lastReminder: string;
  nextReminder: string;
  isActive: boolean;
  createdAt: string;
}

interface MobileRemindersProps {
  userId: string;
  initialPlants?: Plant[];
  showHeader?: boolean;
  isSchedulerOpen?: boolean;
  onSchedulerOpenChange?: (open: boolean) => void;
}

interface MobileRemindersContentProps extends MobileRemindersProps {
  showHeader: boolean;
}

interface MobileRemindersData {
  plants: Plant[];
  reminders: Reminder[];
}

function MobileRemindersSkeleton({ showHeader }: { showHeader: boolean }) {
  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>
      )}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

async function fetchMobileRemindersData(
  userId: string,
  initialPlants?: Plant[]
): Promise<MobileRemindersData> {
  const remindersRef = collection(db, "users", userId, "reminders");
  const remindersSnapshot = await getDocs(query(remindersRef));
  const reminders: Reminder[] = [];

  remindersSnapshot.forEach((docSnapshot) => {
    reminders.push({ id: docSnapshot.id, ...docSnapshot.data() } as Reminder);
  });

  if (initialPlants) {
    return { reminders, plants: [...initialPlants] };
  }

  const plantsSnapshot = await getDocs(query(plantsCol(userId)));
  const plants: Plant[] = [];
  plantsSnapshot.forEach((docSnapshot) => {
    plants.push({ id: docSnapshot.id, ...docSnapshot.data() } as Plant);
  });

  return { reminders, plants };
}

function MobileRemindersContent({
  userId,
  initialPlants,
  showHeader,
  isSchedulerOpen: externalIsSchedulerOpen,
  onSchedulerOpenChange: externalOnSchedulerOpenChange,
}: MobileRemindersContentProps) {
  const { t } = useTranslation(["reminders", "common", "dashboard", "plants"]);
  const { handleFirebaseError } = useErrorHandler();
  const router = useRouter();

  const cacheKey = `mobile-reminders-${userId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchMobileRemindersData(userId, initialPlants)
  );
  const { reminders: initialReminders, plants } = resource.read();

  const [reminders, setReminders] = useState<Reminder[]>(
    () => initialReminders
  );
  const [internalIsSchedulerOpen, setInternalIsSchedulerOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Use external scheduler state if provided, otherwise use internal state
  const isSchedulerOpen = externalIsSchedulerOpen ?? internalIsSchedulerOpen;
  const setIsSchedulerOpen =
    externalOnSchedulerOpenChange ?? setInternalIsSchedulerOpen;

  useEffect(() => {
    const remindersCollection = collection(db, "users", userId, "reminders");
    const remindersQuery = query(remindersCollection);

    const unsubscribe = onSnapshot(
      remindersQuery,
      (querySnapshot) => {
        const remindersData: Reminder[] = [];
        querySnapshot.forEach((docSnapshot) => {
          remindersData.push({
            id: docSnapshot.id,
            ...docSnapshot.data(),
          } as Reminder);
        });
        setReminders(remindersData);
      },
      (error) => {
        handleFirebaseError(error, "listening to reminders");
      }
    );

    return () => unsubscribe();
  }, [userId, handleFirebaseError]);

  const handleComplete = async (reminderId: string, intervalDays: number) => {
    try {
      const now = new Date();
      const next = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      const reminderRef = doc(db, "users", userId, "reminders", reminderId);
      await updateDoc(reminderRef, {
        lastReminder: now.toISOString(),
        nextReminder: next.toISOString(),
      });
    } catch (error) {
      handleFirebaseError(error, "marking reminder done");
    }
  };

  const handleSnooze = async (reminderId: string, hours: number) => {
    try {
      const reminder = reminders.find((r) => r.id === reminderId);
      if (!reminder) return;

      const currentNext = new Date(reminder.nextReminder);
      const snoozeTime = new Date(
        currentNext.getTime() + hours * 60 * 60 * 1000
      );
      const reminderRef = doc(db, "users", userId, "reminders", reminderId);
      await updateDoc(reminderRef, {
        nextReminder: snoozeTime.toISOString(),
      });
    } catch (error) {
      handleFirebaseError(error, "snoozing reminder");
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (reminderId: string) => {
    try {
      const reminderRef = doc(db, "users", userId, "reminders", reminderId);
      await deleteDoc(reminderRef);
    } catch (error) {
      handleFirebaseError(error, "deleting reminder");
    }
  };

  const handleReminderAdded = () => {
    // Reminders will be updated automatically via onSnapshot
  };

  const handleReminderUpdated = () => {
    // Reminders will be updated automatically via onSnapshot
  };

  const handleSchedulerOpenChange = (open: boolean) => {
    setIsSchedulerOpen(open);
  };

  const now = new Date();
  const activeReminders = reminders.filter((r) => r.isActive);
  const overdueCount = activeReminders.filter(
    (r) => new Date(r.nextReminder) < now
  ).length;
  const dueSoonThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dueSoonCount = activeReminders.filter((r) => {
    const next = new Date(r.nextReminder);
    return next >= now && next <= dueSoonThreshold;
  }).length;

  if (plants.length === 0) {
    return (
      <div className="space-y-6">
        {showHeader && (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">
              {t("reminders", { ns: "dashboard" })}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("pageDescription", { ns: "reminders" })}
            </p>
          </div>
        )}

        <Card>
          <CardContent className="p-6 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">
              {t("noPlants", { ns: "dashboard" })}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t("noPlantsHint", { ns: "reminders" })}
            </p>
            <Button
              onClick={() => router.push(ROUTE_PLANTS_NEW)}
              className="min-h-[48px]"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("newPlant.addPlant", { ns: "plants" })}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {showHeader && !isSchedulerOpen && (
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            {t("reminders", { ns: "dashboard" })}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("pageDescription", { ns: "reminders" })}
          </p>

          <div className="flex justify-center gap-3 pt-2">
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueCount} {t("overdue", { ns: "reminders" }).toLowerCase()}
              </Badge>
            )}
            {dueSoonCount > 0 && (
              <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {dueSoonCount} {t("dueSoon", { ns: "reminders" }).toLowerCase()}
              </Badge>
            )}
            {activeReminders.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeReminders.length} {t("active", { ns: "reminders" })}
              </Badge>
            )}
          </div>
        </div>
      )}

      <MobileReminderScheduler
        plants={plants}
        onReminderAdded={handleReminderAdded}
        isOpen={isSchedulerOpen}
        onOpenChange={handleSchedulerOpenChange}
      />

      {!isSchedulerOpen &&
        (reminders.length > 0 ? (
          <MobileReminderCards
            reminders={reminders}
            onComplete={handleComplete}
            onSnooze={handleSnooze}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">
                {t("noReminders", { ns: "reminders" })}
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                {t("noRemindersDesc", { ns: "reminders" })}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>{t("getStartedHint", { ns: "reminders" })}</span>
              </div>
            </CardContent>
          </Card>
        ))}

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

export function MobileReminders({
  userId,
  initialPlants,
  showHeader = true,
  isSchedulerOpen,
  onSchedulerOpenChange,
}: MobileRemindersProps) {
  return (
    <Suspense fallback={<MobileRemindersSkeleton showHeader={showHeader} />}>
      <MobileRemindersContent
        userId={userId}
        initialPlants={initialPlants}
        showHeader={showHeader}
        isSchedulerOpen={isSchedulerOpen}
        onSchedulerOpenChange={onSchedulerOpenChange}
      />
    </Suspense>
  );
}
