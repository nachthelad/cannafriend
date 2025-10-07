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
import { getDocs, query } from "firebase/firestore";
import { ROUTE_LOGIN, ROUTE_REMINDERS_NEW, resolveHomePathForRoles } from "@/lib/routes";
import { useUserRoles } from "@/hooks/use-user-roles";
import { plantsCol, remindersCol } from "@/lib/paths";
import { ReminderSystem } from "@/components/plant/reminder-system";
import { MobileReminders } from "@/components/mobile/mobile-reminders";
import { useTranslation } from "react-i18next";
import type { Plant, Reminder } from "@/types";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PushNotificationTest } from "@/components/reminders/push-notification-test";

interface RemindersData {
  plants: Plant[];
  reminders: Reminder[];
}

async function fetchRemindersData(userId: string): Promise<RemindersData> {
  const [plantsSnapshot, remindersSnapshot] = await Promise.all([
    getDocs(query(plantsCol(userId))),
    getDocs(query(remindersCol(userId))),
  ]);

  const plants = plantsSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Plant)
  );

  const reminders = remindersSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Reminder)
  );

  return { plants, reminders };
}

function RemindersContent({ userId }: { userId: string }) {
  const { t } = useTranslation(["reminders", "common", "dashboard"]);
  const { roles } = useUserRoles();
  const router = useRouter();
  const homePath = resolveHomePathForRoles(roles);

  const cacheKey = `reminders-${userId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchRemindersData(userId)
  );
  const { plants, reminders } = resource.read();

  const handleAddReminder = () => {
    router.push(ROUTE_REMINDERS_NEW);
  };

  return (
    <>
      <ResponsivePageHeader
        title={t("reminders", { ns: "dashboard" })}
        description={t("pageDescription", { ns: "reminders" })}
        backHref={homePath}
        mobileActions={
          <Button size="icon" onClick={handleAddReminder}>
            <Plus className="h-5 w-5" />
          </Button>
        }
        desktopActions={
          <Button onClick={handleAddReminder}>
            <Plus className="h-4 w-4 mr-2" />
            {t("add", { ns: "reminders" })}
          </Button>
        }
      />

      {/* Development Test Component */}
      {process.env.NODE_ENV === "development" && (
        <div className="mb-6">
          <PushNotificationTest />
        </div>
      )}

      {/* Mobile View */}
      <div className="md:hidden">
        <MobileReminders
          userId={userId}
          initialPlants={plants}
          initialReminders={reminders}
          showHeader={false}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex md:flex-col md:gap-6">
        {plants.length > 0 ? (
          <ReminderSystem
            plants={plants}
            reminders={reminders}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t("noPlants", { ns: "dashboard" })}</CardTitle>
              <CardDescription>
                {t("noPlantDesc", { ns: "dashboard" })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("noPlantsHint", { ns: "reminders" })}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
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
