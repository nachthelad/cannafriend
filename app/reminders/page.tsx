"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import { deleteDoc, getDocs, query } from "firebase/firestore";
import {
  ROUTE_LOGIN,
  ROUTE_REMINDERS_NEW,
  ROUTE_PLANTS_NEW,
  resolveHomePathForRoles,
} from "@/lib/routes";
import { useUserRoles } from "@/hooks/use-user-roles";
import { plantsCol, remindersCol } from "@/lib/paths";
import { ReminderSystem } from "@/components/plant/reminder-system";
import { useTranslation } from "react-i18next";
import type {
  Plant,
  Reminder,
  RemindersContentProps,
  RemindersData,
} from "@/types";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PushNotificationTest } from "@/components/reminders/push-notification-test";
import { MobileReminders } from "@/components/mobile/mobile-reminders";
import { isPlantGrowing, normalizePlant } from "@/lib/plant-utils";

async function fetchRemindersData(userId: string): Promise<RemindersData> {
  const [plantsSnapshot, remindersSnapshot] = await Promise.all([
    getDocs(query(plantsCol(userId))),
    getDocs(query(remindersCol(userId))),
  ]);

  const plants = plantsSnapshot.docs
    .map((doc) => normalizePlant(doc.data(), doc.id))
    .filter(isPlantGrowing);

  let legacyDeletedCount = 0;
  const reminders: Reminder[] = [];

  for (const doc of remindersSnapshot.docs) {
    const data = { id: doc.id, ...doc.data() } as Reminder;
    if (!Array.isArray(data.daysOfWeek) || !data.timeOfDay) {
      // Legacy reminder: delete it and count it so we can notify the user
      await deleteDoc(doc.ref);
      legacyDeletedCount++;
      continue;
    }
    reminders.push(data);
  }

  return { plants, reminders, legacyDeletedCount };
}

function RemindersContent({ userId }: RemindersContentProps) {
  const { t } = useTranslation(["reminders", "common", "dashboard", "plants"]);
  const { roles } = useUserRoles();
  const router = useRouter();
  const homePath = resolveHomePathForRoles(roles);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  const cacheKey = `reminders-${userId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchRemindersData(userId)
  );
  const { plants, reminders, legacyDeletedCount } = resource.read();

  useEffect(() => {
    // Show migration notice only once if legacy reminders were deleted
    if (legacyDeletedCount > 0 && typeof window !== "undefined") {
      const seenKey = `reminders-migration-${userId}`;
      const seen = window.localStorage.getItem(seenKey);
      if (!seen) {
        setShowMigrationModal(true);
        window.localStorage.setItem(seenKey, "seen");
      }
    }
  }, [legacyDeletedCount, userId]);

  const hasGrowingPlants = plants.length > 0;
  const hasReminders = reminders.length > 0;
  const shouldShowManager = hasGrowingPlants || hasReminders;

  const handleAddClick = () => {
    if (!hasGrowingPlants) {
      router.push(ROUTE_PLANTS_NEW);
    } else {
      router.push(ROUTE_REMINDERS_NEW);
    }
  };

  const addButtonLabel = !hasGrowingPlants
    ? t("emptyState.addPlant", { ns: "plants" })
    : t("add", { ns: "reminders" });

  return (
    <>
      <ResponsivePageHeader
        title={t("reminders", { ns: "dashboard" })}
        description={t("pageDescription", { ns: "reminders" })}
        backHref={homePath}
        mobileActions={
          <Button
            size="icon"
            onClick={handleAddClick}
            aria-label={addButtonLabel}
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
        desktopActions={
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            {addButtonLabel}
          </Button>
        }
      />

      {/* Development Test Component */}
      {process.env.NODE_ENV === "development" && (
        <div className="mb-6">
          <PushNotificationTest />
        </div>
      )}

      {shouldShowManager ? (
        <>
          {!hasGrowingPlants && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {t("allPlantsEnded", { ns: "reminders" })}
                </CardTitle>
                <CardDescription>
                  {t("allPlantsEndedDesc", { ns: "reminders" })}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <div className="md:hidden">
            <MobileReminders
              userId={userId}
              plants={plants}
              initialReminders={reminders}
            />
          </div>
          <div className="hidden md:block">
            <ReminderSystem plants={plants} reminders={reminders} />
          </div>
        </>
      ) : (
        <Card>
          <CardHeader className="gap-0">
            <CardTitle>{t("noPlants", { ns: "dashboard" })}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground ">
              {t("noPlantsHint", { ns: "reminders" })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Legacy migration notice */}
      {showMigrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-lg w-full shadow-lg">
            <CardHeader>
              <CardTitle>
                {t("migrationTitle", {
                  ns: "reminders",
                  defaultValue: "Reminder system updated",
                })}
              </CardTitle>
              <CardDescription>
                {t("migrationDesc", {
                  ns: "reminders",
                  defaultValue:
                    "Your old reminders were removed. Please create new alarms with days and time.",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowMigrationModal(false)}
              >
                {t("close", { ns: "common", defaultValue: "Close" })}
              </Button>
              <Button onClick={() => router.push(ROUTE_REMINDERS_NEW)}>
                {t("add", { ns: "reminders" })}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default function RemindersPage() {
  const { user, isLoading: authLoading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.push(ROUTE_LOGIN);
    }
  }, [authLoading, user, router]);

  const fallback = (
    <div className="p-4 md:px-0 md:py-6">
      <RemindersSkeleton />
    </div>
  );

  if (authLoading || !user) {
    return <Layout>{fallback}</Layout>;
  }

  return (
    <Layout>
      <Suspense fallback={fallback}>
        <RemindersContent userId={user.uid} />
      </Suspense>
    </Layout>
  );
}

function RemindersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
