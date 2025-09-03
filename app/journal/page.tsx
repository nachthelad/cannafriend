"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { db } from "@/lib/firebase";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN } from "@/lib/routes";
import { plantsCol, logsCol } from "@/lib/paths";
import {
  collectionGroup,
  where,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import {
  collection,
  query,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Layout } from "@/components/layout";
import { JournalEntries } from "@/components/journal/journal-entries";
import { MobileDatePicker } from "@/components/ui/mobile-date-picker";
import { MobileJournal } from "@/components/mobile/mobile-journal";
import { Filter, Plus } from "lucide-react";
import { AnimatedLogo } from "@/components/common/animated-logo";
import { parseISO, isSameDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { Plant, LogEntry } from "@/types";

export default function JournalPage() {
  const { t, i18n } = useTranslation(["journal", "common"]);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedPlant, setSelectedPlant] = useState<string>("all");
  const [selectedLogType, setSelectedLogType] = useState<string>("all");
  const [lastLogDoc, setLastLogDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreLogs, setHasMoreLogs] = useState(false);
  const [loadingMoreLogs, setLoadingMoreLogs] = useState(false);
  const LOGS_PAGE_SIZE = 25;

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        // Fetch plants (for selectors and name mapping)
        const plantsQueryRef = query(plantsCol(userId));
        const plantsSnap = await getDocs(plantsQueryRef);

        const plantsData: Plant[] = [];
        plantsSnap.forEach((docSnap) => {
          plantsData.push({ id: docSnap.id, ...docSnap.data() } as Plant);
        });
        setPlants(plantsData);

        // Try collectionGroup for logs (requires plantId/userId fields saved)
        const logsGroup = collectionGroup(db, "logs");
        const cgQuery = query(
          logsGroup,
          where("userId", "==", userId),
          orderBy("date", "desc"),
          limit(LOGS_PAGE_SIZE)
        );
        let cgSnap;
        try {
          cgSnap = await getDocs(cgQuery);
        } catch (e: any) {
          // Fallback: if rules deny collection group, fetch per-plant
          const allLogs: LogEntry[] = [];
          for (const plant of plantsData) {
            const lq = query(
              logsCol(userId, plant.id),
              orderBy("date", "desc"),
              limit(LOGS_PAGE_SIZE)
            );
            const ls = await getDocs(lq);
            ls.forEach((docSnap) => {
              allLogs.push({
                id: docSnap.id,
                ...(docSnap.data() as any),
                plantId: plant.id,
                plantName: plant.name,
              } as LogEntry);
            });
          }
          // Sort and set minimal paging state
          allLogs.sort(
            (a, b) =>
              new Date(b.date as string).getTime() -
              new Date(a.date as string).getTime()
          );
          setLogs(allLogs);
          setIsLoading(false);
          return;
        }

        const allLogs: LogEntry[] = [];
        cgSnap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const plantName = plantsData.find((p) => p.id === data.plantId)?.name;
          allLogs.push({ id: docSnap.id, ...data, plantName } as LogEntry);
        });
        setLastLogDoc(
          cgSnap.docs.length > 0 ? cgSnap.docs[cgSnap.docs.length - 1] : null
        );
        setHasMoreLogs(cgSnap.docs.length === LOGS_PAGE_SIZE);

        // Sort by date (newest first)
        allLogs.sort(
          (a, b) =>
            new Date(b.date as string).getTime() -
            new Date(a.date as string).getTime()
        );
        setLogs(allLogs);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: t("error", { ns: "journal" }),
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) void fetchData();
  }, [userId, toast, t]);

  const loadMoreLogs = async () => {
    if (!userId || !lastLogDoc) return;
    setLoadingMoreLogs(true);
    try {
      const logsGroup = collectionGroup(db, "logs");
      const nextQuery = query(
        logsGroup,
        where("userId", "==", userId),
        orderBy("date", "desc"),
        startAfter(lastLogDoc),
        limit(LOGS_PAGE_SIZE)
      );
      const snap = await getDocs(nextQuery);
      const more: LogEntry[] = snap.docs.map((d) => {
        const data = d.data() as any;
        const plantName = plants.find((p) => p.id === data.plantId)?.name;
        return { id: d.id, ...data, plantName } as LogEntry;
      });
      setLogs((prev) => [...prev, ...more]);
      setLastLogDoc(
        snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : lastLogDoc
      );
      setHasMoreLogs(snap.docs.length === LOGS_PAGE_SIZE);
    } finally {
      setLoadingMoreLogs(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedPlant !== "all" && (log as any).plantId !== selectedPlant)
      return false;
    if (selectedLogType !== "all" && log.type !== selectedLogType) return false;
    if (selectedDate && log.date) {
      const logDate = parseISO(log.date);
      if (!isSameDay(logDate, selectedDate)) return false;
    }
    return true;
  });

  const getLogsForDate = (date: Date) =>
    logs.filter((log) => {
      if (selectedPlant !== "all" && (log as any).plantId !== selectedPlant)
        return false;
      if (selectedLogType !== "all" && log.type !== selectedLogType)
        return false;
      return log.date && isSameDay(parseISO(log.date), date);
    });

  // Precompute days with logs for markers (YYYY-MM-DD local)
  const daysWithLogs = new Set(
    logs
      .filter((log) => {
        if (selectedPlant !== "all" && (log as any).plantId !== selectedPlant)
          return false;
        if (selectedLogType !== "all" && log.type !== selectedLogType)
          return false;
        return Boolean(log.date);
      })
      .map((l) => {
        const d = parseISO(l.date as string);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      })
  );

  // Annotate calendar days with a dot marker using DOM (desktop + mobile)
  useEffect(() => {
    let raf = 0;
    const annotate = () => {
      const buttons = document.querySelectorAll(
        '[data-slot="calendar"] [data-day]'
      ) as NodeListOf<HTMLElement>;
      buttons.forEach((btn) => {
        const dateStr = btn.getAttribute("data-day") || "";
        const has = daysWithLogs.has(dateStr);
        let dot = btn.querySelector<HTMLSpanElement>(".log-dot");
        if (has) {
          if (!dot) {
            dot = document.createElement("span");
            dot.className =
              "log-dot pointer-events-none absolute bottom-[6px] md:bottom-[2px] left-1/2 -translate-x-1/2 inline-block h-1.5 w-1.5 rounded-full bg-primary";
            if (!btn.style.position) btn.style.position = "relative";
            btn.appendChild(dot);
          }
        } else if (dot) {
          dot.remove();
        }
      });
    };

    // schedule on next frame to ensure calendar is mounted
    raf = requestAnimationFrame(annotate);
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(annotate);
    });
    observer.observe(document.body, { subtree: true, childList: true });
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [daysWithLogs, selectedPlant, selectedLogType]);

  const handleLogSuccess = (newLog: LogEntry) => {
    const plant = plants.find((p) => p.id === (newLog as any).plantId);
    const logWithPlant = {
      ...newLog,
      plantName: plant?.name || "Unknown Plant",
    } as LogEntry;
    setLogs([logWithPlant, ...logs]);
  };

  const getCalendarLocale = () => (i18n.language === "es" ? es : enUS);

  const handleDeleteLog = async (log: LogEntry) => {
    if (!userId || !log.id) return;
    try {
      await deleteDoc(
        doc(db, "users", userId, "plants", (log as any).plantId, "logs", log.id)
      );
      setLogs((prev) => prev.filter((l) => l.id !== log.id));
      toast({
        title: t("deleted", { ns: "journal" }),
        description: t("deletedDesc", { ns: "journal" }),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error", { ns: "common" }),
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <AnimatedLogo size={32} className="text-primary" duration={1.5} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Mobile Journal */}
      <div className="md:hidden">
        <MobileJournal
          logs={logs}
          plants={plants}
          isLoading={isLoading}
          hasMoreLogs={hasMoreLogs}
          loadingMoreLogs={loadingMoreLogs}
          onLoadMore={loadMoreLogs}
          onDeleteLog={handleDeleteLog}
          onLogSuccess={handleLogSuccess}
          language={i18n.language}
        />
      </div>

      {/* Desktop Journal */}
      <div className="hidden md:block">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t("title", { ns: "journal" })}</h1>
          <p className="text-muted-foreground">{t("description", { ns: "journal" })}</p>
        </div>

      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        {/* Left column: Filters + calendar */}
        <Card className="md:sticky md:top-4 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              {t("filters", { ns: "journal" })}
            </CardTitle>
            <CardDescription>{t("filtersDesc", { ns: "journal" })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("filterByPlant", { ns: "journal" })}
              </label>
              <Select value={selectedPlant} onValueChange={setSelectedPlant}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectPlant", { ns: "journal" })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allPlants", { ns: "journal" })}</SelectItem>
                  {plants.map((plant) => (
                    <SelectItem key={plant.id} value={plant.id}>
                      {plant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("filterByType", { ns: "journal" })}
              </label>
              <Select
                value={selectedLogType}
                onValueChange={setSelectedLogType}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectType", { ns: "journal" })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allTypes", { ns: "journal" })}</SelectItem>
                  <SelectItem value="watering">
                    {t("logType.watering", { ns: "journal" })}
                  </SelectItem>
                  <SelectItem value="feeding">
                    {t("logType.feeding", { ns: "journal" })}
                  </SelectItem>
                  <SelectItem value="training">
                    {t("logType.training", { ns: "journal" })}
                  </SelectItem>
                  <SelectItem value="environment">
                    {t("logType.environment", { ns: "journal" })}
                  </SelectItem>
                  <SelectItem value="flowering">
                    {t("logType.flowering", { ns: "journal" })}
                  </SelectItem>
                  <SelectItem value="note">{t("logType.note", { ns: "journal" })}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("filterByDate", { ns: "journal" })}
              </label>
              <MobileDatePicker
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={getCalendarLocale()}
              />
              {/* Calendar markers dot via CSS: inject data-has-logs flag per day via DOM attribute hook */}
              {selectedDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(undefined)}
                  className="w-full"
                >
                  {t("clearDate", { ns: "journal" })}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Right column: Logs List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{t("recentLogs", { ns: "journal" })}</CardTitle>
              <CardDescription>
                {filteredLogs.length} {t("logsFound", { ns: "journal" })}
              </CardDescription>
            </div>
            <Button 
              size="icon" 
              aria-label="Add log"
              onClick={() => router.push("/journal/new")}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <JournalEntries
              logs={filteredLogs}
              showPlantName={true}
              onDelete={handleDeleteLog}
            />
            {hasMoreLogs && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={loadMoreLogs}
                  disabled={loadingMoreLogs}
                >
                  {loadingMoreLogs ? (
                    <>
                      <AnimatedLogo size={16} className="mr-2 text-primary" duration={1.2} />{" "}
                      {t("loading", { ns: "common" })}
                    </>
                  ) : (
                    t("loadMore", { ns: "common" })
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </Layout>
  );
}
