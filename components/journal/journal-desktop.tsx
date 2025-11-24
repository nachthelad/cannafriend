"use client";

import { useMemo, useState, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LocalizedCalendar as CalendarComponent } from "@/components/ui/calendar";
import { JournalEntries } from "@/components/journal/journal-entries";
import { JournalSkeleton } from "@/components/skeletons/journal-skeleton";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { fetchJournalData } from "@/lib/journal-data";
import type {
  JournalDesktopProps,
  JournalSortBy,
  JournalSortOrder,
} from "@/types/journal";
import { es, enUS } from "date-fns/locale";
import { format, isSameDay, parseISO } from "date-fns";
import {
  Filter,
  Calendar as CalendarIcon,
  Search,
  SortAsc,
  SortDesc,
  X,
} from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  invalidateJournalCache,
  invalidatePlantsCache,
  invalidateDashboardCache,
  invalidatePlantDetails,
} from "@/lib/suspense-cache";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import type { LogEntry } from "@/types";

function JournalDesktopContent({ userId, language }: JournalDesktopProps) {
  const { t } = useTranslation(["journal", "common"]);
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();
  const cacheKey = `journal-${userId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchJournalData(userId)
  );
  const { logs: initialLogs, plants } = resource.read();

  // Update local logs if initialLogs changes
  const [logs, setLogs] = useState(initialLogs);

  // Sync local state with prop updates
  useMemo(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  const [searchText, setSearchText] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<string>("all");
  const [selectedLogType, setSelectedLogType] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<JournalSortBy>("date");
  const [sortOrder, setSortOrder] = useState<JournalSortOrder>("desc");
  const [logToDelete, setLogToDelete] = useState<LogEntry | null>(null);

  // Calculate days with logs for the calendar
  const daysWithLogs = useMemo(() => {
    return logs.map((log) => parseISO(log.date as string));
  }, [logs]);

  const filteredAndSortedLogs = useMemo(() => {
    return logs
      .filter((log) => {
        if (searchText) {
          const searchLower = searchText.toLowerCase();
          const matchesNotes = log.notes?.toLowerCase().includes(searchLower);
          const matchesPlant = log.plantName
            ?.toLowerCase()
            .includes(searchLower);
          const matchesType = t(`logType.${log.type}`, { ns: "journal" })
            .toLowerCase()
            .includes(searchLower);

          if (!matchesNotes && !matchesPlant && !matchesType) {
            return false;
          }
        }

        if (selectedPlant !== "all" && (log as any).plantId !== selectedPlant) {
          return false;
        }

        if (selectedLogType !== "all" && log.type !== selectedLogType) {
          return false;
        }

        if (selectedDate && log.date) {
          const logDate = parseISO(log.date);
          if (!isSameDay(logDate, selectedDate)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case "date":
            comparison =
              new Date(a.date as string).getTime() -
              new Date(b.date as string).getTime();
            break;
          case "type":
            comparison = a.type.localeCompare(b.type);
            break;
          case "plant":
            comparison = (a.plantName || "").localeCompare(b.plantName || "");
            break;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [
    logs,
    searchText,
    selectedPlant,
    selectedLogType,
    selectedDate,
    sortBy,
    sortOrder,
    t,
  ]);

  const logTypes = [...new Set(logs.map((log) => log.type))];
  const locale = language === "es" ? es : enUS;

  const clearFilters = () => {
    setSelectedPlant("all");
    setSelectedLogType("all");
    setSelectedDate(undefined);
    setSearchText("");
  };

  const confirmDeleteLog = async () => {
    if (!userId || !logToDelete || !logToDelete.id) return;

    const log = logToDelete;
    setLogToDelete(null);

    const previousLogs = [...logs];
    setLogs((prev) => prev.filter((l) => l.id !== log.id));

    try {
      if (!log.plantId) {
        throw new Error("Log missing plantId");
      }

      await deleteDoc(
        doc(db, "users", userId, "plants", log.plantId, "logs", log.id)
      );

      invalidateJournalCache(userId);
      invalidatePlantsCache(userId);
      invalidatePlantDetails(userId, log.plantId);
      invalidateDashboardCache(userId);

      toast({
        title: t("deleted", { ns: "journal" }),
        description: t("deletedDesc", { ns: "journal" }),
      });
    } catch (error: any) {
      setLogs(previousLogs);
      handleFirebaseError(error, "delete log");
    }
  };

  const handleDeleteClick = (log: LogEntry) => {
    setLogToDelete(log);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Left Sidebar - Calendar & Filters */}
      <div className="lg:col-span-4 xl:col-span-3 space-y-6">
        {/* Calendar Section - Cleaner Look */}
        <div className="p-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2 px-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            {t("calendar", { ns: "common" })}
          </h3>
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={locale}
            className="rounded-md border w-full flex justify-center bg-transparent"
            modifiers={{ hasLogs: daysWithLogs }}
          />
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(undefined)}
              className="w-full mt-2 text-muted-foreground hover:text-foreground"
            >
              {t("clearDate", { ns: "journal" })}
            </Button>
          )}
        </div>

        {/* Filters Card */}
        <h3 className="font-semibold flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          {t("filters.title", { ns: "journal" })}
        </h3>
        <div className="bg-card rounded-xl border shadow-sm p-4 space-y-6">
          <div className="flex items-center justify-between">
            {(selectedPlant !== "all" || selectedLogType !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPlant("all");
                  setSelectedLogType("all");
                }}
                className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
              >
                {t("filters.clear", { ns: "journal" })}
              </Button>
            )}
          </div>

          {/* Plant Filter */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("filterByPlant", { ns: "journal" })}
            </label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedPlant === "all" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => setSelectedPlant("all")}
              >
                {t("allPlants", { ns: "journal" })}
              </Badge>
              {plants.map((plant) => (
                <Badge
                  key={plant.id}
                  variant={selectedPlant === plant.id ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => setSelectedPlant(plant.id)}
                >
                  {plant.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("filterByType", { ns: "journal" })}
            </label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedLogType === "all" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => setSelectedLogType("all")}
              >
                {t("allTypes", { ns: "journal" })}
              </Badge>
              {logTypes.map((type) => (
                <Badge
                  key={type}
                  variant={selectedLogType === type ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => setSelectedLogType(type)}
                >
                  {t(`logType.${type}`, { ns: "journal" })}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Content - Log Feed */}
      <div className="lg:col-span-8 xl:col-span-9 space-y-4">
        {/* Feed Header - Cleaner Look */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between px-4 py-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {t("journal", { ns: "nav" })}
            </h2>
            <p className="text-muted-foreground">
              {filteredAndSortedLogs.length} {t("logsFound", { ns: "journal" })}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder", { ns: "journal" })}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-all"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 bg-background/50 border-border/50"
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("date")}>
                  {t("sort.byDate", { ns: "journal" })}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("type")}>
                  {t("sort.byType", { ns: "journal" })}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("plant")}>
                  {t("sort.byPlant", { ns: "journal" })}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc"
                    ? t("sort.descending", { ns: "journal" })
                    : t("sort.ascending", { ns: "journal" })}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Logs List */}
        <div className="min-h-[400px]">
          <JournalEntries
            logs={filteredAndSortedLogs}
            showPlantName
            onDelete={handleDeleteClick}
          />
        </div>
      </div>

      <AlertDialog
        open={!!logToDelete}
        onOpenChange={(open) => !open && setLogToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteLogTitle", { ns: "journal" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteLogDesc", { ns: "journal" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("cancel", { ns: "common" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLog}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete", { ns: "common" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function JournalDesktop(props: JournalDesktopProps) {
  return (
    <Suspense fallback={<JournalSkeleton />}>
      <JournalDesktopContent {...props} />
    </Suspense>
  );
}
