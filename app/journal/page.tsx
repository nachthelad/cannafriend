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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { auth, db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Layout } from "@/components/layout";
import { AddLogForm } from "@/components/add-log-form";
import { JournalEntries } from "@/components/journal-entries";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Filter, Plus, Loader2 } from "lucide-react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { Plant, LogEntry } from "@/types";

export default function JournalPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedPlant, setSelectedPlant] = useState<string>("all");
  const [selectedLogType, setSelectedLogType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("list");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // Check if we're in demo mode
        const isDemoMode =
          (typeof window !== "undefined" &&
            window.location.search.includes("demo=true")) ||
          !auth.currentUser;
        if (isDemoMode) {
          setUserId("demo-user-123");
        } else {
          router.push("/login");
        }
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
        plantsSnap.forEach((doc) => {
          plantsData.push({ id: doc.id, ...doc.data() } as Plant);
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

          logsSnap.forEach((doc) => {
            allLogs.push({
              id: doc.id,
              ...doc.data(),
              plantId: plant.id,
              plantName: plant.name,
            } as LogEntry & { plantId: string; plantName: string });
          });
        }

        // Sort by date (newest first)
        allLogs.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
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

    if (userId) {
      fetchData();
    }
  }, [userId, toast, t]);

  const filteredLogs = logs.filter((log) => {
    // Filter by plant
    if (selectedPlant !== "all" && log.plantId !== selectedPlant) {
      return false;
    }

    // Filter by log type
    if (selectedLogType !== "all" && log.type !== selectedLogType) {
      return false;
    }

    // Filter by date (if date is selected)
    if (selectedDate && log.date) {
      const logDate = parseISO(log.date);
      if (!isSameDay(logDate, selectedDate)) {
        return false;
      }
    }

    return true;
  });

  const getLogsForDate = (date: Date) => {
    return logs.filter((log) => {
      if (selectedPlant !== "all" && log.plantId !== selectedPlant) {
        return false;
      }
      if (selectedLogType !== "all" && log.type !== selectedLogType) {
        return false;
      }
      return log.date && isSameDay(parseISO(log.date), date);
    });
  };

  const handleLogSuccess = (newLog: LogEntry) => {
    // Find the plant name for the new log
    const plant = plants.find((p) => p.id === newLog.plantId);
    const logWithPlant = {
      ...newLog,
      plantName: plant?.name || "Unknown Plant",
    };
    setLogs([logWithPlant, ...logs]);
  };

  const getCalendarLocale = () => {
    return language === "es" ? es : enUS;
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="list">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {t("journal.listView")}
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {t("journal.calendarView")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
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
                  <Select
                    value={selectedPlant}
                    onValueChange={setSelectedPlant}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("journal.selectPlant")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("journal.allPlants")}
                      </SelectItem>
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
                      <SelectItem value="all">
                        {t("journal.allTypes")}
                      </SelectItem>
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
                      <SelectItem value="note">{t("logType.note")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("journal.filterByDate")}
                  </label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
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

            {/* Add Log Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("journal.addLog")}
                </CardTitle>
                <CardDescription>{t("journal.addLogDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <AddLogForm
                  plantId={plants.length > 0 ? plants[0].id : ""}
                  onSuccess={handleLogSuccess}
                  showPlantSelector={true}
                  plants={plants}
                />
              </CardContent>
            </Card>

            {/* Logs List */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t("journal.recentLogs")}</CardTitle>
                <CardDescription>
                  {filteredLogs.length} {t("journal.logsFound")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JournalEntries logs={filteredLogs} showPlantName={true} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>{t("journal.calendarView")}</CardTitle>
              <CardDescription>{t("journal.calendarDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-4">
                {/* Calendar Filters */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t("journal.filterByPlant")}
                    </label>
                    <Select
                      value={selectedPlant}
                      onValueChange={setSelectedPlant}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("journal.selectPlant")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t("journal.allPlants")}
                        </SelectItem>
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
                        <SelectItem value="all">
                          {t("journal.allTypes")}
                        </SelectItem>
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
                        <SelectItem value="note">
                          {t("logType.note")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Calendar */}
                <div className="md:col-span-3">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    locale={getCalendarLocale()}
                    modifiers={{
                      hasLogs: (date) => getLogsForDate(date).length > 0,
                    }}
                    modifiersStyles={{
                      hasLogs: {
                        backgroundColor: "hsl(var(--primary))",
                        color: "white",
                      },
                    }}
                  />
                </div>
              </div>

              {/* Selected Date Logs */}
              {selectedDate && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {t("journal.logsFor")}{" "}
                    {format(selectedDate, "PPP", {
                      locale: getCalendarLocale(),
                    })}
                  </h3>
                  <JournalEntries
                    logs={getLogsForDate(selectedDate)}
                    showPlantName={true}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
