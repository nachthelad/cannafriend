"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedLogo } from "@/components/common/animated-logo";
import { useTranslation } from "@/hooks/use-translation";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useAuthUser } from "@/hooks/use-auth-user";
import { auth, db } from "@/lib/firebase";
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
import { ROUTE_LOGIN } from "@/lib/routes";
import { MobileReminderCards } from "./mobile-reminder-cards";
import { MobileReminderScheduler } from "./mobile-reminder-scheduler";
import { Bell, Plus, TrendingUp } from "lucide-react";
import type { Plant } from "@/types";

interface Reminder {
  id: string;
  plantId: string;
  plantName: string;
  type: "watering" | "feeding" | "training" | "custom";
  title: string;
  description: string;
  interval: number; // days
  lastReminder: string;
  nextReminder: string;
  isActive: boolean;
  createdAt: string;
}

interface MobileRemindersProps {
  showHeader?: boolean;
}

export function MobileReminders({ showHeader = true }: MobileRemindersProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchPlants = async () => {
      if (!userId) return;
      try {
        const q = query(plantsCol(userId));
        const snap = await getDocs(q);
        const list: Plant[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Plant));
        setPlants(list);
      } catch (error: any) {
        handleFirebaseError(error, "fetching plants");
      }
    };
    if (userId) void fetchPlants();
  }, [userId, handleFirebaseError]);

  useEffect(() => {
    if (!userId) return;

    const remindersRef = collection(db, "users", userId, "reminders");
    const q = query(remindersRef);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const remindersData: Reminder[] = [];
        querySnapshot.forEach((doc) => {
          remindersData.push({ id: doc.id, ...doc.data() } as Reminder);
        });
        setReminders(remindersData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching reminders:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const handleComplete = async (reminderId: string, intervalDays: number) => {
    if (!auth.currentUser) return;
    try {
      const now = new Date();
      const next = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      const reminderRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "reminders",
        reminderId
      );
      await updateDoc(reminderRef, {
        lastReminder: now.toISOString(),
        nextReminder: next.toISOString(),
      });
    } catch (error: any) {
      handleFirebaseError(error, "marking reminder done");
    }
  };

  const handleSnooze = async (reminderId: string, hours: number) => {
    if (!auth.currentUser) return;
    try {
      const reminder = reminders.find((r) => r.id === reminderId);
      if (!reminder) return;

      const currentNext = new Date(reminder.nextReminder);
      const snoozeTime = new Date(
        currentNext.getTime() + hours * 60 * 60 * 1000
      );

      const reminderRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "reminders",
        reminderId
      );
      await updateDoc(reminderRef, {
        nextReminder: snoozeTime.toISOString(),
      });
    } catch (error: any) {
      handleFirebaseError(error, "snoozing reminder");
    }
  };

  const handleEdit = (reminder: Reminder) => {
    // TODO: Implement edit functionality
    toast({
      title: t("common.comingSoon"),
      description: t("reminders.editComingSoon"),
    });
  };

  const handleDelete = async (reminderId: string) => {
    if (!auth.currentUser) return;
    try {
      const reminderRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "reminders",
        reminderId
      );
      await deleteDoc(reminderRef);
    } catch (error: any) {
      handleFirebaseError(error, "deleting reminder");
    }
  };

  const handleReminderAdded = () => {
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

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <AnimatedLogo size={32} className="text-primary" duration={1.5} />
      </div>
    );
  }

  if (plants.length === 0) {
    return (
      <div className="space-y-6">
        {showHeader && (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">
              {t("dashboard.reminders")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("reminders.pageDescription")}
            </p>
          </div>
        )}

        <Card>
          <CardContent className="p-6 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">
              {t("dashboard.noPlants")}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t("reminders.noPlantsDesc")}
            </p>
            <Button
              onClick={() => router.push("/plants/new")}
              className="min-h-[48px]"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("plants.addPlant")}
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
          <h1 className="text-2xl font-bold">{t("dashboard.reminders")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("reminders.pageDescription")}
          </p>

          {/* Status Summary */}
          <div className="flex justify-center gap-3 pt-2">
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueCount} {t("reminders.overdue").toLowerCase()}
              </Badge>
            )}
            {dueSoonCount > 0 && (
              <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {dueSoonCount} {t("reminders.dueSoon").toLowerCase()}
              </Badge>
            )}
            {activeReminders.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeReminders.length} {t("reminders.active")}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Add Reminder Button / Scheduler */}
      <MobileReminderScheduler
        plants={plants}
        onReminderAdded={handleReminderAdded}
        isOpen={isSchedulerOpen}
        onOpenChange={handleSchedulerOpenChange}
      />

      {/* Reminder Cards */}
      {!isSchedulerOpen && (
        reminders.length > 0 ? (
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
                {t("reminders.noReminders")}
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                {t("reminders.noRemindersDesc")}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>{t("reminders.getStartedHint")}</span>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
