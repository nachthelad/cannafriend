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
import {
  query,
  getDocs,
  orderBy,
  limit,
  collectionGroup,
  where,
} from "firebase/firestore";
import { ReminderSystem } from "@/components/plant/reminder-system";
import { PlantCard } from "@/components/plant/plant-card";
import { JournalEntries } from "@/components/journal/journal-entries";
import { MobileDashboard } from "@/components/mobile/mobile-dashboard";
import {
  Plus,
  Brain,
  Shield,
  Bell,
  Package,
  NotebookPen,
  Leaf,
  Calendar,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRoles } from "@/hooks/use-user-roles";
import { DataCard } from "@/components/common/data-card";
import type {
  DashboardContainerProps,
  DashboardData,
  LogEntry,
  Plant,
} from "@/types";
import { auth, db } from "@/lib/firebase";
import { ADMIN_EMAIL } from "@/lib/constants";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { isPlantGrowing, normalizePlant } from "@/lib/plant-utils";
import { FastLogAction } from "@/components/dashboard/fast-log-action";

async function fetchDashboardData(userId: string): Promise<DashboardData> {
  // Fetch plants
  const plantsQuery = query(plantsCol(userId));
  const plantsSnapshot = await getDocs(plantsQuery);

  const plants: Plant[] = [];
  const lastWaterings: Record<string, LogEntry> = {};
  const lastFeedings: Record<string, LogEntry> = {};
  const lastTrainings: Record<string, LogEntry> = {};
  const allLogs: LogEntry[] = [];
  const plantMap: Record<string, string> = {};

  // Process plants first, ensuring they are available even if log fetch fails
  const plantDocs = plantsSnapshot.docs;
  for (const plantDoc of plantDocs) {
    const plantData = normalizePlant(plantDoc.data(), plantDoc.id);

    if (!isPlantGrowing(plantData)) {
      continue;
    }

    plants.push(plantData);
    plantMap[plantData.id] = plantData.name;
  }

  // Fetch all recent logs for the user using Collection Group Query
  // This avoids N+1 queries (one per plant)
  const logsGroup = collectionGroup(db, "logs");
  const logsQuery = query(
    logsGroup,
    where("userId", "==", userId),
    orderBy("date", "desc"),
    limit(50) // Fetch enough to cover recent activity for multiple plants
  );

  try {
    const logsSnapshot = await getDocs(logsQuery);
    const fetchedLogs = logsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        plantName: data.plantId ? plantMap[data.plantId] : undefined,
      };
    }) as LogEntry[];

    allLogs.push(...fetchedLogs);

    // Map logs to plants for "last action" determination
    // We iterate through plants and find their matching logs from the fetched set
    for (const plant of plants) {
      // Filter logs for this specific plant
      const plantLogs = fetchedLogs.filter((log) => log.plantId === plant.id);

      // Find last actions from the memory-filtered logs
      const lastWatering = plantLogs.find((log) => log.type === "watering");
      const lastFeeding = plantLogs.find((log) => log.type === "feeding");
      const lastTraining = plantLogs.find((log) => log.type === "training");

      if (lastWatering) lastWaterings[plant.id] = lastWatering;
      if (lastFeeding) lastFeedings[plant.id] = lastFeeding;
      if (lastTraining) lastTrainings[plant.id] = lastTraining;
    }
  } catch (error) {
    console.error("Error fetching dashboard logs:", error);
    // Fallback or empty state handled by default empty arrays
    // If CGQ fails (e.g. index missing), we might want to log it or fallback to individual queries
    // For now, we assume index exists or will be created
  }

  // Sort all logs by date and take the most recent for the widget
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

          {/* Stats Overview - 3 key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DataCard
              label={t("yourPlants", { ns: "dashboard" })}
              value={plants.length}
              icon={Leaf}
              color="success"
              href={ROUTE_PLANTS}
            />
            <DataCard
              label={t("recentLogs", { ns: "journal" })}
              value={recentLogs.length}
              icon={Calendar}
              color="default"
              href={ROUTE_JOURNAL}
            />
            {roles?.grower && (
              <DataCard
                label={t("title", { ns: "reminders" })}
                value={remindersCount}
                icon={Bell}
                color={hasOverdue ? "warning" : "default"}
                href={ROUTE_REMINDERS}
              />
            )}
          </div>

          {/* Widgets grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>{t("yourPlants", { ns: "dashboard" })}</CardTitle>
                  <CardDescription>
                    {plants.length} {t("inTotal", { ns: "dashboard" })}
                  </CardDescription>
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
                  <Button asChild>
                    <Link href="/plants/new">
                      <Plus className="mr-2 h-4 w-4" />{" "}
                      {t("addPlant", { ns: "dashboard" })}
                    </Link>
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
                {roles?.grower && (
                  <FastLogAction
                    plants={plants}
                    renderTrigger={({ onClick, disabled }) => (
                      <Button onClick={onClick} disabled={disabled}>
                        <NotebookPen className="h-4 w-4 mr-1" />
                        {t("fastLogTitle", { ns: "dashboard" })}
                      </Button>
                    )}
                  />
                )}
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

        {/* Reminder System Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>

        {/* Plants Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>

        {/* Journal Widget Skeleton */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-44" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>
      </div>

      {/* Desktop skeleton */}
      <div className="hidden md:block space-y-6">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>

        {/* Reminder System Skeleton */}
        <Skeleton className="h-16 w-full rounded-xl" />

        {/* Main Content Skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Plants Widget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-9 w-16" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Journal Widget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-9 w-16" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-32" />
            ))}
          </CardContent>
        </Card>
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
