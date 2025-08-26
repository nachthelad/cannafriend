"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ROUTE_STRAINS,
  ROUTE_REMINDERS,
  ROUTE_ANALYZE_PLANT,
  ROUTE_PLANTS,
  ROUTE_JOURNAL,
  ROUTE_NUTRIENTS,
  resolveHomePathForRoles,
} from "@/lib/routes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN } from "@/lib/routes";
import { plantsCol, logsCol, remindersCol } from "@/lib/paths";
import { query, getDocs, orderBy } from "firebase/firestore";
import { Layout } from "@/components/layout";
import { ReminderSystem } from "@/components/plant/reminder-system";
import { PlantCard } from "@/components/plant/plant-card";
import { JournalEntries } from "@/components/journal/journal-entries";
import {
  Plus,
  Loader2,
  AlertTriangle,
  ChevronDown,
  Bell,
  Brain,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserRoles } from "@/hooks/use-user-roles";
import { usePremium } from "@/hooks/use-premium";
import type { Plant, LogEntry } from "@/types";
import { db } from "@/lib/firebase";
import { collection } from "firebase/firestore";
import { buildNutrientMixesPath } from "@/lib/firebase-config";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { roles } = useUserRoles();
  const router = useRouter();
  const { toast } = useToast();
  const { isPremium } = usePremium();
  const [isLoading, setIsLoading] = useState(true);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
  const [lastWaterings, setLastWaterings] = useState<Record<string, LogEntry>>(
    {}
  );
  const [lastFeedings, setLastFeedings] = useState<Record<string, LogEntry>>(
    {}
  );
  const [lastTrainings, setLastTrainings] = useState<Record<string, LogEntry>>(
    {}
  );
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;
  const [hasOverdue, setHasOverdue] = useState(false);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [nutrientMixesCount, setNutrientMixesCount] = useState<number>(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchPlants = async () => {
      if (!userId) return;

      try {
        const q = query(plantsCol(userId));
        const querySnapshot = await getDocs(q);

        const plantsData: Plant[] = [];
        const wateringsData: Record<string, LogEntry> = {};
        const feedingsData: Record<string, LogEntry> = {};
        const trainingsData: Record<string, LogEntry> = {};
        const allLogs: LogEntry[] = [];

        // Fetch plants and their last logs in parallel (limited)
        const plantDocs = querySnapshot.docs;
        // Build plant data first
        for (const d of plantDocs) {
          const p = { id: d.id, ...d.data() } as Plant;
          plantsData.push(p);
        }

        // Parallelize per-plant log fetches with limit and slicing to reduce payload
        const logFetches = plantDocs.map(async (d) => {
          try {
            const allLogsQuery = query(
              logsCol(userId, d.id),
              orderBy("date", "desc")
            );
            const allLogsSnap = await getDocs(allLogsQuery);
            const logsForPlant = allLogsSnap.docs.map((ld) => ({
              id: ld.id,
              ...ld.data(),
            })) as LogEntry[];

            const firstWatering = logsForPlant.find(
              (l) => l.type === "watering"
            );
            const firstFeeding = logsForPlant.find((l) => l.type === "feeding");
            const firstTraining = logsForPlant.find(
              (l) => l.type === "training"
            );

            if (firstWatering) wateringsData[d.id] = firstWatering;
            if (firstFeeding) feedingsData[d.id] = firstFeeding;
            if (firstTraining) trainingsData[d.id] = firstTraining;

            // keep only the newest 3 per plant for the recent widget
            const newest = logsForPlant.slice(0, 3);
            const plant = plantsData.find((p) => p.id === d.id);
            newest.forEach((l) =>
              allLogs.push({
                ...l,
                plantId: d.id,
                plantName: plant?.name,
              })
            );
          } catch (error) {
            console.error(`Error fetching logs for plant ${d.id}:`, error);
          }
        });

        await Promise.all(logFetches);

        setPlants(plantsData);
        setFilteredPlants(plantsData);
        setLastWaterings(wateringsData);
        setLastFeedings(feedingsData);
        setLastTrainings(trainingsData);

        // Compute recent logs (newest first, limit 5)
        allLogs.sort(
          (a, b) =>
            new Date(b.date as string).getTime() -
            new Date(a.date as string).getTime()
        );
        setRecentLogs(allLogs.slice(0, 5));

        // Compute overdue reminders for dashboard badge
        try {
          const rq = query(remindersCol(userId));
          const rsnap = await getDocs(rq);
          const now = new Date();
          let overdue = false;
          rsnap.forEach((d) => {
            const r: any = d.data();
            if (
              r?.isActive &&
              r?.nextReminder &&
              new Date(r.nextReminder) < now
            ) {
              overdue = true;
            }
          });
          setHasOverdue(overdue);
        } catch {
          // ignore reminder fetch errors on dashboard
        }
        // Nutrient mixes count
        try {
          const mixesSnap = await getDocs(
            query(collection(db, buildNutrientMixesPath(userId)))
          );
          setNutrientMixesCount(mixesSnap.size);
        } catch {}
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: t("dashboard.error"),
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchPlants();
    }
  }, [userId, toast, t]);

  // Widgets data
  const topPlants = plants.slice(0, 3);

  return (
    <Layout>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center">
          {/* Desktop title */}
          <h1 className="hidden md:block text-3xl font-bold">
            {t("dashboard.title")}
          </h1>
          {/* Mobile: title acts as trigger when both roles; otherwise just title */}
          {roles?.grower && roles?.consumer ? (
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="switch" className="flex items-center p-0">
                    <h1 className="text-3xl font-bold">
                      {t("dashboard.title")}
                    </h1>
                    <ChevronDown className="h-5 w-5 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={2}>
                  <DropdownMenuItem
                    className="text-base py-2"
                    onClick={() => router.push(ROUTE_STRAINS)}
                  >
                    {t("strains.title")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <h1 className="md:hidden text-3xl font-bold">
              {t("dashboard.title")}
            </h1>
          )}
        </div>
        {hasOverdue && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-800 px-2 py-0.5 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("reminders.overdue")}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
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
                  <CardTitle>{t("dashboard.yourPlants")}</CardTitle>
                  <CardDescription>{plants.length} total</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTE_PLANTS}>{t("common.view")}</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {plants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topPlants.map((plant) => (
                      <PlantCard key={plant.id} plant={plant} compact />
                    ))}
                  </div>
                ) : (
                  <Button onClick={() => router.push("/plants/new")}>
                    <Plus className="mr-2 h-4 w-4" /> {t("dashboard.addPlant")}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Journal Widget */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>{t("journal.recentLogs")}</CardTitle>
                  <CardDescription>
                    {recentLogs.length} {t("journal.logsFound")}
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTE_JOURNAL}>{t("common.view")}</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <JournalEntries logs={recentLogs} showPlantName={true} />
              </CardContent>
            </Card>

            {/* Nutrients Widget */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>{t("nutrients.title")}</CardTitle>
                  <CardDescription>{nutrientMixesCount} mixes</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTE_NUTRIENTS}>{t("common.view")}</Link>
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
                  <Link href="/plants/new">{t("nav.addPlant")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={ROUTE_REMINDERS}>{t("dashboard.reminders")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={ROUTE_JOURNAL}>{t("nav.journal")}</Link>
                </Button>
                {isPremium && (
                  <Button
                    asChild
                    className="text-white bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500"
                  >
                    <Link href={ROUTE_ANALYZE_PLANT}>
                      <Brain className="h-4 w-4 mr-1" />{" "}
                      {t("analyzePlant.title")}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </Layout>
  );
}
