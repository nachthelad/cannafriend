"use client";

import { Suspense, useMemo, useState, useEffect } from "react";

import Link from "next/link";
import { ROUTE_REMINDERS, ROUTE_PLANTS, ROUTE_JOURNAL } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { plantsCol, remindersCol } from "@/lib/paths";
import {
  query,
  getDocs,
  orderBy,
  limit,
  collectionGroup,
  where,
} from "firebase/firestore";
import { PlantCard } from "@/components/plant/plant-card";
import { JournalEntries } from "@/components/journal/journal-entries";
import { MobileDashboard } from "@/components/mobile/mobile-dashboard";
import { AlertTriangle, Plus, X } from "lucide-react";

import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { DataErrorBoundary } from "@/components/common/data-error-boundary";
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

async function fetchDashboardData(userId: string): Promise<DashboardData> {
  // 1. Start all network requests concurrently to eliminate waterfall
  const plantsQuery = query(plantsCol(userId));
  const plantsPromise = getDocs(plantsQuery);

  const logsQuery = query(
    collectionGroup(db, "logs"),
    where("userId", "==", userId),
    orderBy("date", "desc"),
    limit(50),
  );
  const logsPromise = getDocs(logsQuery);

  const remindersQuery = query(remindersCol(userId));
  const remindersPromise = getDocs(remindersQuery);

  const tokenPromise = auth.currentUser
    ? auth.currentUser.getIdTokenResult()
    : Promise.resolve(null);

  // 2. Await results
  const plantsSnapshot = await plantsPromise;

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

  try {
    const logsSnapshot = await logsPromise;
    const fetchedLogs = logsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        plantName: data.plantId ? plantMap[data.plantId] : undefined,
      };
    }) as LogEntry[];

    allLogs.push(...fetchedLogs);

    for (const plant of plants) {
      const plantLogs = fetchedLogs.filter((log) => log.plantId === plant.id);
      const lastWatering = plantLogs.find((log) => log.type === "watering");
      const lastFeeding = plantLogs.find((log) => log.type === "feeding");
      const lastTraining = plantLogs.find((log) => log.type === "training");

      if (lastWatering) lastWaterings[plant.id] = lastWatering;
      if (lastFeeding) lastFeedings[plant.id] = lastFeeding;
      if (lastTraining) lastTrainings[plant.id] = lastTraining;
    }
  } catch (error) {
    console.error("Error fetching dashboard logs:", error);
  }

  const recentLogs = allLogs
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  let remindersCount = 0;
  let hasOverdue = false;
  let reminders: any[] = [];
  try {
    const remindersSnapshot = await remindersPromise;
    const now = new Date();

    reminders = remindersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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
    // Ignore
  }

  let isPremium = false;
  try {
    if (
      typeof window !== "undefined" &&
      localStorage.getItem("cf_premium_v1") === "1"
    ) {
      isPremium = true;
    } else if (auth.currentUser) {
      const token = await tokenPromise;
      if (token) {
        const claims = token.claims as any;
        const boolPremium = Boolean(claims?.premium);
        const until =
          typeof claims?.premium_until === "number" ? claims.premium_until : 0;
        const timePremium = until > Date.now();
        isPremium = Boolean(boolPremium || timePremium);
      }
    }
  } catch {
    // Ignore
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

function DashboardContent({
  userId,
  userEmail,
  isAdmin,
}: DashboardContainerProps & { isAdmin: boolean }) {
  const { t } = useTranslation([
    "dashboard",
    "common",
    "reminders",
    "journal",
    "nav",
    "aiAssistant",
  ]);

  const cacheKey = `dashboard-${userId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchDashboardData(userId),
  );
  const {
    plants,
    lastWaterings,
    lastFeedings,
    lastTrainings,
    recentLogs,
    remindersCount,
    hasOverdue,
    reminders,
    isPremium,
  } = resource.read();

  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!hasOverdue) return;

    const dismissedData = localStorage.getItem("overdue_alert_dismissed_v1");
    if (dismissedData) {
      try {
        const { timestamp } = JSON.parse(dismissedData);
        const hasNewerOverdue = reminders.some((r: any) => {
          if (!r.nextReminder || !r.isActive) return false;
          const nextDate = new Date(r.nextReminder).getTime();
          return nextDate <= Date.now() && nextDate > timestamp;
        });

        if (!hasNewerOverdue) {
          setIsDismissed(true);
        }
      } catch (e) {
        console.error("Error parsing dismissal data:", e);
      }
    }
  }, [hasOverdue, reminders]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(
      "overdue_alert_dismissed_v1",
      JSON.stringify({ timestamp: Date.now() }),
    );
  };

  return (
    <>
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

      <div className="hidden md:flex flex-col flex-1 min-h-0 gap-6">
        {hasOverdue && !isDismissed && (
          <div className="bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 p-4 rounded-lg flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <AlertTriangle
                className="h-5 w-5 text-orange-600"
                aria-hidden="true"
              />
              <span className="font-semibold text-orange-800 dark:text-orange-200">
                {t("overdue", { ns: "reminders" })}:{" "}
                {t("overdueRemindersDesc", { ns: "dashboard" })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="link"
                size="sm"
                className="text-orange-700 dark:text-orange-400"
                onClick={handleDismiss}
              >
                <Link href={ROUTE_REMINDERS}>
                  {t("view", { ns: "common" })}
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-orange-600 hover:bg-orange-200 dark:hover:bg-orange-900/40"
                onClick={handleDismiss}
                aria-label={t("close", { ns: "common" })}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 shrink-0">
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
            <CardContent className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-0">
              <div className="p-6 pt-0">
                {plants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plants.map((plant) => (
                      <PlantCard
                        key={plant.id}
                        plant={plant}
                        lastWatering={lastWaterings[plant.id]}
                        lastFeeding={lastFeedings[plant.id]}
                        lastTraining={lastTrainings[plant.id]}
                      />
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
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 shrink-0">
              <div>
                <CardTitle>{t("recentLogs", { ns: "journal" })}</CardTitle>
                <CardDescription>
                  {t("showingLastEntries", { ns: "dashboard" })}
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={ROUTE_JOURNAL}>{t("view", { ns: "common" })}</Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-0">
              <div className="p-6 pt-0">
                <JournalEntries
                  logs={recentLogs.slice(0, 5)}
                  showPlantName={true}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export function DashboardContainer({
  userId,
  userEmail,
}: DashboardContainerProps) {
  const { t } = useTranslation(["dashboard", "common"]);
  const isAdmin = (userEmail || "").toLowerCase() === ADMIN_EMAIL;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="hidden md:block">
        <div className="mb-6 shrink-0">
          <h1 className="text-3xl font-bold">
            {t("title", { ns: "dashboard" })}
          </h1>
        </div>
      </div>
      <DataErrorBoundary>
        <Suspense
          fallback={
            <div className="p-0">
              <DashboardSkeleton />
            </div>
          }
        >
          <DashboardContent
            userId={userId}
            userEmail={userEmail}
            isAdmin={isAdmin}
          />
        </Suspense>
      </DataErrorBoundary>
    </div>
  );
}
