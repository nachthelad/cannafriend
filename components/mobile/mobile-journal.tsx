"use client";

import type {
  MobileJournalData,
  MobileJournalProps,
  MobileJournalSortBy,
  MobileJournalSortOrder,
} from "@/types/mobile";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { LocalizedCalendar as CalendarComponent } from "@/components/ui/calendar";
import { useRouter } from "next/navigation";
import {
  Filter,
  Plus,
  Calendar,
  X,
  Search,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { db } from "@/lib/firebase";
import { plantsCol, logsCol } from "@/lib/paths";
import {
  query,
  getDocs,
  orderBy,
  collectionGroup,
  where,
  limit,
} from "firebase/firestore";
import type { Plant, LogEntry } from "@/types";
import { JournalSkeleton } from "@/components/skeletons/journal-skeleton";
import { JournalEntries } from "@/components/journal/journal-entries";
import { normalizePlant } from "@/lib/plant-utils";

async function fetchJournalData(userId: string): Promise<MobileJournalData> {
  // Fetch plants
  const plantsQueryRef = query(plantsCol(userId));
  const plantsSnap = await getDocs(plantsQueryRef);
  const plants: Plant[] = [];
  plantsSnap.forEach((docSnap) => {
    plants.push(normalizePlant(docSnap.data(), docSnap.id));
  });

  // Fetch logs using collectionGroup
  const logsGroup = collectionGroup(db, "logs");
  const cgQuery = query(
    logsGroup,
    where("userId", "==", userId),
    orderBy("date", "desc"),
    limit(50)
  );

  const logs: LogEntry[] = [];
  try {
    const cgSnap = await getDocs(cgQuery);
    cgSnap.forEach((docSnap) => {
      const data = docSnap.data() as any;
      const plantName = plants.find((p) => p.id === data.plantId)?.name;
      logs.push({ id: docSnap.id, ...data, plantName } as LogEntry);
    });
  } catch (e) {
    // Fallback: fetch per-plant if collectionGroup fails
    for (const plant of plants) {
      const lq = query(
        logsCol(userId, plant.id),
        orderBy("date", "desc"),
        limit(20)
      );
      const ls = await getDocs(lq);
      ls.forEach((docSnap) => {
        logs.push({
          id: docSnap.id,
          ...(docSnap.data() as any),
          plantId: plant.id,
          plantName: plant.name,
        } as LogEntry);
      });
    }
  }

  // Sort by date (newest first)
  logs.sort(
    (a, b) =>
      new Date(b.date as string).getTime() -
      new Date(a.date as string).getTime()
  );

  return { logs, plants };
}

function MobileJournalContent({ userId, language }: MobileJournalProps) {
  const cacheKey = `mobile-journal-${userId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchJournalData(userId)
  );
  const { logs, plants } = resource.read();
  const { t } = useTranslation(["journal", "common"]);
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedPlant, setSelectedPlant] = useState<string>("all");
  const [selectedLogType, setSelectedLogType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<MobileJournalSortBy>("date");
  const [sortOrder, setSortOrder] = useState<MobileJournalSortOrder>("desc");
  const [showCalendar, setShowCalendar] = useState(false);

  // Filter and sort logs
  const filteredAndSortedLogs = logs
    .filter((log) => {
      // Text search
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesNotes = log.notes?.toLowerCase().includes(searchLower);
        const matchesPlant = log.plantName?.toLowerCase().includes(searchLower);
        const matchesType = t(`logType.${log.type}`, { ns: "journal" })
          .toLowerCase()
          .includes(searchLower);
        if (!matchesNotes && !matchesPlant && !matchesType) {
          return false;
        }
      }

      // Plant filter
      if (selectedPlant !== "all" && (log as any).plantId !== selectedPlant) {
        return false;
      }

      // Log type filter
      if (selectedLogType !== "all" && log.type !== selectedLogType) {
        return false;
      }

      // Date filter
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

  // Active filters count
  const activeFiltersCount = [
    selectedPlant !== "all",
    selectedLogType !== "all",
    selectedDate !== undefined,
    searchText.trim() !== "",
  ].filter(Boolean).length;

  // Available log types from current logs
  const logTypes = [...new Set(logs.map((log) => log.type))];

  const getCalendarLocale = () => (language === "es" ? es : enUS);

  const clearFilters = () => {
    setSelectedPlant("all");
    setSelectedLogType("all");
    setSelectedDate(undefined);
    setSearchText("");
  };

  const logsFoundDescription = `${filteredAndSortedLogs.length} ${t(
    "logsFound",
    { ns: "journal" }
  )}`;

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder", { ns: "journal" })}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10 pr-10 h-11"
          />
          {searchText && (
            <button
              onClick={() => setSearchText("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter and Sort Row */}
        <div className="flex items-center gap-2">
          {/* Filters Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(true)}
            className="relative h-11 flex-1 max-w-32"
          >
            <Filter className="h-4 w-4 mr-2" />
            {t("filters.title", { ns: "journal" })}
            {activeFiltersCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Calendar Button */}
          <Button
            variant={selectedDate ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCalendar(true)}
            className="h-11 px-3"
          >
            <Calendar className="h-4 w-4" />
          </Button>

          {/* Sort Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-11 px-3">
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

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("filters.active", { ns: "journal" })}:
          </span>
          {searchText && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => setSearchText("")}
            >
              "{searchText.slice(0, 15)}
              {searchText.length > 15 ? "..." : ""}"
              <X className="h-3 w-3" />
            </Badge>
          )}
          {selectedPlant !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => setSelectedPlant("all")}
            >
              {plants.find((p) => p.id === selectedPlant)?.name || "Plant"}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {selectedLogType !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => setSelectedLogType("all")}
            >
              {t(`logType.${selectedLogType}`, { ns: "journal" })}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {selectedDate && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => setSelectedDate(undefined)}
            >
              {format(selectedDate, "MMM d", { locale: getCalendarLocale() })}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {activeFiltersCount > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 px-2 text-xs"
            >
              {t("filters.clear", { ns: "journal" })}
            </Button>
          )}
        </div>
      )}

      {/* Journal Entries */}
      {filteredAndSortedLogs.length > 0 ? (
        <div className="space-y-4">
          <JournalEntries
            logs={filteredAndSortedLogs}
            showPlantName={true}
            onDelete={() => {}}
          />
        </div>
      ) : (
        <Card className="text-center py-8">
          <CardContent>
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">
              {activeFiltersCount > 0
                ? t("noFilteredLogs", { ns: "journal" })
                : t("noLogs", { ns: "journal" })}
            </CardTitle>
            <CardDescription className="mb-6">
              {activeFiltersCount > 0
                ? t("tryDifferentFilters", { ns: "journal" })
                : t("addFirstLog", { ns: "journal" })}
            </CardDescription>
            {activeFiltersCount === 0 && (
              <Button onClick={() => router.push("/journal/new")}>
                <Plus className="h-4 w-4 mr-2" />{" "}
                {t("addLog", { ns: "journal" })}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters Modal */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("filters.title", { ns: "journal" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Plant Filter */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                {t("filterByPlant", { ns: "journal" })}
              </label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedPlant === "all" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedPlant("all")}
                >
                  {t("allPlants", { ns: "journal" })}
                </Badge>
                {plants.map((plant) => (
                  <Badge
                    key={plant.id}
                    variant={selectedPlant === plant.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedPlant(plant.id)}
                  >
                    {plant.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Log Type Filter */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                {t("filterByType", { ns: "journal" })}
              </label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedLogType === "all" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedLogType("all")}
                >
                  {t("allTypes", { ns: "journal" })}
                </Badge>
                {logTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={selectedLogType === type ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedLogType(type)}
                  >
                    {t(`logType.${type}`, { ns: "journal" })}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  clearFilters();
                  setShowFilters(false);
                }}
                className="w-full"
              >
                {t("filters.clear", { ns: "journal" })} ({activeFiltersCount})
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Calendar Modal */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("selectDate", { ns: "journal" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setShowCalendar(false);
              }}
              locale={getCalendarLocale()}
              className="rounded-md border w-full"
            />
            {selectedDate && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDate(undefined);
                  setShowCalendar(false);
                }}
                className="w-full"
              >
                {t("clearDate", { ns: "journal" })}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function MobileJournal(props: MobileJournalProps) {
  return (
    <Suspense fallback={<JournalSkeleton />}>
      <MobileJournalContent {...props} />
    </Suspense>
  );
}
