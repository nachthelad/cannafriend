"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ROUTE_REMINDERS,
  ROUTE_AI_ASSISTANT,
  ROUTE_PLANTS,
  ROUTE_JOURNAL,
  ROUTE_NUTRIENTS,
  ROUTE_ADMIN,
  ROUTE_STASH,
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
import { Plus, AlertTriangle, Bell, Brain, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRoles } from "@/hooks/use-user-roles";
import { usePremium } from "@/hooks/use-premium";
import type { Plant, LogEntry } from "@/types";
import { db } from "@/lib/firebase";
import { collection } from "firebase/firestore";
import { buildNutrientMixesPath } from "@/lib/firebase-config";
import { ADMIN_EMAIL } from "@/lib/constants";
import { getSuspenseResource } from "@/lib/suspense-utils";

interface DashboardContainerProps {
  userId: string;
  userEmail: string;
}

interface DashboardData {
  plants: Plant[];
  lastWaterings: Record<string, LogEntry>;
  lastFeedings: Record<string, LogEntry>;
  lastTrainings: Record<string, LogEntry>;
  recentLogs: LogEntry[];
  nutrientMixesCount: number;
  hasOverdue: boolean;
}

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
    const plantData = { id: plantDoc.id, ...plantDoc.data() } as Plant;
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

  // Fetch nutrient mixes count
  let nutrientMixesCount = 0;
  try {
    const nutrientMixesRef = collection(db, buildNutrientMixesPath(userId));
    const nutrientMixesSnapshot = await getDocs(nutrientMixesRef);
    nutrientMixesCount = nutrientMixesSnapshot.size;
  } catch {
    // Ignore nutrient mixes errors
  }

  // Check for overdue reminders (simplified)
  let hasOverdue = false;
  try {
    const remindersQuery = query(remindersCol(userId));
    const remindersSnapshot = await getDocs(remindersQuery);
    const now = new Date();

    for (const doc of remindersSnapshot.docs) {
      const reminder = doc.data();
      if (reminder.nextDate && new Date(reminder.nextDate) < now) {
        hasOverdue = true;
        break;
      }
    }
  } catch {
    // Ignore reminders errors
  }

  return {
    plants,
    lastWaterings,
    lastFeedings,
    lastTrainings,
    recentLogs,
    nutrientMixesCount,
    hasOverdue,
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
  const { isPremium } = usePremium();

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
    lastWaterings,
    lastFeedings,
    lastTrainings,
    recentLogs,
    nutrientMixesCount,
    hasOverdue,
  } = resource.read();

  // Filter plants for mobile view
  const filteredPlants = plants.slice(0, 3); // Show first 3 on mobile

  return (
    <>
      {/* Mobile Dashboard */}
      <div className="md:hidden">
        <MobileDashboard
          plants={filteredPlants}
          recentLogs={recentLogs.slice(0, 5)}
          hasOverdue={hasOverdue}
          isLoading={false}
          userEmail={userEmail}
          nutrientMixesCount={nutrientMixesCount}
        />
      </div>

      {/* Desktop Dashboard */}
      <div className="hidden md:block">
        <div className="space-y-6">
          {/* Overdue Reminders only (Top) */}
          <div>
            <ReminderSystem plants={plants} showOnlyOverdue />
          </div>

          {/* Widgets grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plants Widget */}
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
                    {plants.slice(0, 3).map((plant) => (
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

            {/* Nutrients Widget */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>{t("title", { ns: "nutrients" })}</CardTitle>
                  <CardDescription>{nutrientMixesCount} mixes</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTE_NUTRIENTS}>
                    {t("view", { ns: "common" })}
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Guarda tus recetas (NPK, notas) y regístralas en los logs.
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones rápidas</CardTitle>
                <CardDescription>Atajos a funciones frecuentes</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/plants/new">{t("addPlant", { ns: "nav" })}</Link>
                </Button>
                <Button asChild>
                  <Link href={ROUTE_REMINDERS}>
                    {t("reminders", { ns: "dashboard" })}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={ROUTE_STASH}>
                    {t("stash.title", { ns: "common" })}
                  </Link>
                </Button>
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
