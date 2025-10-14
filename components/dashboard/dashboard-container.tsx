"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ROUTE_REMINDERS,
  ROUTE_AI_ASSISTANT,
  ROUTE_PLANTS,
  ROUTE_JOURNAL,
  ROUTE_ADMIN,
  ROUTE_STASH,
  ROUTE_PLANTS_NEW,
} from "@/lib/routes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { plantsCol, logsCol, remindersCol } from "@/lib/paths";
import { query, getDocs, orderBy, limit } from "firebase/firestore";
import { ReminderSystem } from "@/components/plant/reminder-system";
import { PlantCard } from "@/components/plant/plant-card";
import { JournalEntries } from "@/components/journal/journal-entries";
import { MobileDashboard } from "@/components/mobile/mobile-dashboard";
import { Plus, Brain, Shield, Bell, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRoles } from "@/hooks/use-user-roles";
import type {
  DashboardContainerProps,
  DashboardData,
  LogEntry,
  Plant,
} from "@/types";
import { auth } from "@/lib/firebase";
import { ADMIN_EMAIL } from "@/lib/constants";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { isPlantGrowing, normalizePlant } from "@/lib/plant-utils";

async function fetchDashboardData(userId: string): Promise<DashboardData> {
  // Fetch plants
  const plantsQuery = query(plantsCol(userId));
  const plantsSnapshot = await getDocs(plantsQuery);

  const plants: Plant[] = [];
  const lastWaterings: Record<string, LogEntry> = {};
  const lastFeedings: Record<string, LogEntry> = {};
  const lastTrainings: Record<string, LogEntry> = {};
  const allLogs: LogEntry[] = [];

  // Fetch plants and their last logs in parallel (limited)
  const plantDocs = plantsSnapshot.docs;
  for (const plantDoc of plantDocs) {
    const plantData = normalizePlant(plantDoc.data(), plantDoc.id);

    if (!isPlantGrowing(plantData)) {
      continue;
    }

    plants.push(plantData);

    try {
      // Fetch logs for this plant
      const logsQuery = query(
        logsCol(userId, plantDoc.id),
        orderBy("date", "desc"),
        limit(10)
      );
      const logsSnapshot = await getDocs(logsQuery);

      const plantLogs = logsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        plantId: plantDoc.id,
        plantName: plantData.name,
      })) as LogEntry[];

      allLogs.push(...plantLogs);

      // Find last actions
      const lastWatering = plantLogs.find((log) => log.type === "watering");
      const lastFeeding = plantLogs.find((log) => log.type === "feeding");
      const lastTraining = plantLogs.find((log) => log.type === "training");

      if (lastWatering) lastWaterings[plantDoc.id] = lastWatering;
      if (lastFeeding) lastFeedings[plantDoc.id] = lastFeeding;
      if (lastTraining) lastTrainings[plantDoc.id] = lastTraining;
    } catch {
      // Ignore individual plant log errors
    }
  }

  // Sort all logs by date and take the most recent
  const recentLogs = allLogs
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Calculate reminders count (moved above reminders fetch)
  let remindersCount = 0;

  // Fetch reminders and check for overdue
  let hasOverdue = false;
  let reminders: any[] = [];
  try {
    const remindersQuery = query(remindersCol(userId));
    const remindersSnapshot = await getDocs(remindersQuery);
    const now = new Date();

    reminders = remindersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Count total reminders
    remindersCount = reminders.length;

    for (const reminder of reminders) {
      if (
        reminder.nextReminder &&
        new Date(reminder.nextReminder) < now &&
        reminder.isActive
      ) {
        hasOverdue = true;
        break;
      }
    }
  } catch {
    // Ignore reminders errors
  }

  // Check premium status
  let isPremium = false;
  try {
    // Check localStorage flag first
    if (
      typeof window !== "undefined" &&
      localStorage.getItem("cf_premium") === "1"
    ) {
      isPremium = true;
    } else if (auth.currentUser) {
      // Check Firebase custom claims
      const token = await auth.currentUser.getIdTokenResult(true);
      const claims = token.claims as any;
      const boolPremium = Boolean(claims?.premium);
      const until =
        typeof claims?.premium_until === "number" ? claims.premium_until : 0;
      const timePremium = until > Date.now();
      isPremium = Boolean(boolPremium || timePremium);
    }
  } catch {
    // Ignore premium check errors
  }

  return {
    plants,
    lastWaterings,
    lastFeedings,
    lastTrainings,
    recentLogs,
    remindersCount,
    hasOverdue,
    reminders,
    isPremium,
  };
}

function DashboardContent({ userId, userEmail }: DashboardContainerProps) {
  const { t } = useTranslation([
    "dashboard",
    "common",
    "reminders",
    "journal",
    "nutrients",
    "nav",
    "aiAssistant",
  ]);
  const { roles } = useUserRoles();
  const router = useRouter();

  const isAdmin = useMemo(
    () => (userEmail || "").toLowerCase() === ADMIN_EMAIL,
    [userEmail]
  );

  // Get dashboard data from Suspense
  const cacheKey = `dashboard-${userId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchDashboardData(userId)
  );
  const {
    plants,
    recentLogs,
    remindersCount,
    hasOverdue,
    reminders,
    isPremium,
  } = resource.read();

  return (
    <>
      {/* Mobile Dashboard */}
      <div className="md:hidden">
        <MobileDashboard
          plants={plants}
          recentLogs={recentLogs.slice(0, 5)}
          hasOverdue={hasOverdue}
          userEmail={userEmail}
          remindersCount={remindersCount}
          reminders={reminders}
          isPremium={isPremium}
        />
      </div>

      {/* Desktop Dashboard */}
      <div className="hidden md:block">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {t("title", { ns: "dashboard" })}
          </h1>
        </div>
        <div className="space-y-6">
          {/* Overdue Reminders only (Top) */}
          <div>
            <ReminderSystem
              plants={plants}
              showOnlyOverdue
              reminders={reminders}
            />
          </div>

          {/* Widgets grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>{t("yourPlants", { ns: "dashboard" })}</CardTitle>
                  <CardDescription>{plants.length} en total</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTE_PLANTS}>{t("view", { ns: "common" })}</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {plants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plants.map((plant) => (
                      <PlantCard key={plant.id} plant={plant} compact />
                    ))}
                  </div>
                ) : (
                  <Button onClick={() => router.push("/plants/new")}>
                    <Plus className="mr-2 h-4 w-4" />{" "}
                    {t("addPlant", { ns: "dashboard" })}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Journal Widget */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>{t("recentLogs", { ns: "journal" })}</CardTitle>
                  <CardDescription>
                    {t("showingLastEntries", { ns: "dashboard" })}
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTE_JOURNAL}>
                    {t("view", { ns: "common" })}
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <JournalEntries
                  logs={recentLogs.slice(0, 5)}
                  showPlantName={true}
                />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{t("quickActions", { ns: "dashboard" })}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {isPremium && (
                  <Button
                    asChild
                    className="text-white bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500"
                  >
                    <Link href={ROUTE_AI_ASSISTANT}>
                      <Brain className="h-4 w-4 mr-1" />{" "}
                      {t("title", { ns: "aiAssistant" })}
                    </Link>
                  </Button>
                )}
                <Button asChild>
                  <Link href={ROUTE_REMINDERS}>
                    <Bell className="h-4 w-4 mr-1" />{" "}
                    {t("reminders", { ns: "dashboard" })}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={ROUTE_PLANTS_NEW}>
                    <Plus className="h-4 w-4 mr-1" />{" "}
                    {t("addPlant", { ns: "dashboard" })}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={ROUTE_STASH}>
                    <Package className="h-4 w-4 mr-1" />{" "}
                    {t("stash.title", { ns: "common" })}
                  </Link>
                </Button>
                {isAdmin && (
                  <Button asChild>
                    <Link href={ROUTE_ADMIN}>
                      <Shield className="h-4 w-4 mr-1" />
                      Admin
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Mobile skeleton */}
      <div className="md:hidden space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>

        <Skeleton className="h-20 w-full rounded-xl" />
      </div>

      {/* Desktop skeleton */}
      <div className="hidden md:block space-y-6">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-32 w-full mb-4" />
                        <Skeleton className="h-5 w-24 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-28" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardContainer({
  userId,
  userEmail,
}: DashboardContainerProps) {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6">
          <DashboardSkeleton />
        </div>
      }
    >
      <DashboardContent userId={userId} userEmail={userEmail} />
    </Suspense>
  );
}
