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
import { useTranslation } from "@/hooks/use-translation";
import { auth, db } from "@/lib/firebase";
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
import { AddLogForm } from "@/components/journal/add-log-form";
import { JournalEntries } from "@/components/journal/journal-entries";
import { MobileDatePicker } from "@/components/ui/mobile-date-picker";
import { Filter, Plus, Loader2 } from "lucide-react";
import { parseISO, isSameDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { Plant, LogEntry } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function JournalPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedPlant, setSelectedPlant] = useState<string>("all");
  const [selectedLogType, setSelectedLogType] = useState<string>("all");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        // Fetch plants
        const plantsRef = collection(db, "users", userId, "plants");
        const plantsQuery = query(plantsRef);
        const plantsSnap = await getDocs(plantsQuery);

        const plantsData: Plant[] = [];
        plantsSnap.forEach((docSnap) => {
          plantsData.push({ id: docSnap.id, ...docSnap.data() } as Plant);
        });
        setPlants(plantsData);

        // Fetch all logs from all plants
        const allLogs: LogEntry[] = [];
        for (const plant of plantsData) {
          const logsRef = collection(
            db,
            "users",
            userId,
            "plants",
            plant.id,
            "logs"
          );
          const logsQuery = query(logsRef, orderBy("date", "desc"));
          const logsSnap = await getDocs(logsQuery);
          logsSnap.forEach((docSnap) => {
            allLogs.push({
              id: docSnap.id,
              ...docSnap.data(),
              plantId: plant.id,
              plantName: plant.name,
            } as LogEntry);
          });
        }

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
          title: t("journal.error"),
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) void fetchData();
  }, [userId, toast, t]);

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

  const handleLogSuccess = (newLog: LogEntry) => {
    const plant = plants.find((p) => p.id === (newLog as any).plantId);
    const logWithPlant = {
      ...newLog,
      plantName: plant?.name || "Unknown Plant",
    } as LogEntry;
    setLogs([logWithPlant, ...logs]);
  };

  const getCalendarLocale = () => (language === "es" ? es : enUS);

  const handleDeleteLog = async (log: LogEntry) => {
    if (!userId || !log.id) return;
    try {
      await deleteDoc(
        doc(db, "users", userId, "plants", (log as any).plantId, "logs", log.id)
      );
      setLogs((prev) => prev.filter((l) => l.id !== log.id));
      toast({
        title: t("journal.deleted"),
        description: t("journal.deletedDesc"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("journal.title")}</h1>
        <p className="text-muted-foreground">{t("journal.description")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              {t("journal.filters")}
            </CardTitle>
            <CardDescription>{t("journal.filtersDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("journal.filterByPlant")}
              </label>
              <Select value={selectedPlant} onValueChange={setSelectedPlant}>
                <SelectTrigger>
                  <SelectValue placeholder={t("journal.selectPlant")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("journal.allPlants")}</SelectItem>
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
                {t("journal.filterByType")}
              </label>
              <Select
                value={selectedLogType}
                onValueChange={setSelectedLogType}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("journal.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("journal.allTypes")}</SelectItem>
                  <SelectItem value="watering">
                    {t("logType.watering")}
                  </SelectItem>
                  <SelectItem value="feeding">
                    {t("logType.feeding")}
                  </SelectItem>
                  <SelectItem value="training">
                    {t("logType.training")}
                  </SelectItem>
                  <SelectItem value="environment">
                    {t("logType.environment")}
                  </SelectItem>
                  <SelectItem value="flowering">
                    {t("logType.flowering")}
                  </SelectItem>
                  <SelectItem value="note">{t("logType.note")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("journal.filterByDate")}
              </label>
              <MobileDatePicker
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={getCalendarLocale()}
              />
              {selectedDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(undefined)}
                  className="w-full"
                >
                  {t("journal.clearDate")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Spacer to balance grid on desktop */}
        <div className="hidden md:block" />

        {/* Logs List */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{t("journal.recentLogs")}</CardTitle>
              <CardDescription>
                {filteredLogs.length} {t("journal.logsFound")}
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon" aria-label="Add log">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{t("journal.addLog")}</DialogTitle>
                </DialogHeader>
                <AddLogForm
                  plantId={plants.length > 0 ? plants[0].id : ""}
                  onSuccess={handleLogSuccess}
                  showPlantSelector={true}
                  plants={plants}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <JournalEntries
              logs={filteredLogs}
              showPlantName={true}
              onDelete={handleDeleteLog}
            />
          </CardContent>
        </Card>
      </div>

      {/* removed */}
    </Layout>
  );
}
