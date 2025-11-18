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

function JournalDesktopContent({ userId, language }: JournalDesktopProps) {
  const { t } = useTranslation(["journal", "common"]);
  const cacheKey = `journal-desktop-${userId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchJournalData(userId)
  );
  const { logs, plants } = resource.read();

  const [searchText, setSearchText] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<string>("all");
  const [selectedLogType, setSelectedLogType] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<JournalSortBy>("date");
  const [sortOrder, setSortOrder] = useState<JournalSortOrder>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

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

  const activeFiltersCount = [
    selectedPlant !== "all",
    selectedLogType !== "all",
    selectedDate !== undefined,
    searchText.trim() !== "",
  ].filter(Boolean).length;

  const logTypes = [...new Set(logs.map((log) => log.type))];
  const locale = language === "es" ? es : enUS;

  const clearFilters = () => {
    setSelectedPlant("all");
    setSelectedLogType("all");
    setSelectedDate(undefined);
    setSearchText("");
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder", { ns: "journal" })}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={t("clear", { ns: "common" })}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              {t("filters.title", { ns: "journal" })}
              {activeFiltersCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCalendar(true)}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {selectedDate
                ? format(selectedDate, "PPP", { locale })
                : t("filters.date", { ns: "journal" })}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4 mr-2" />
                  ) : (
                    <SortDesc className="h-4 w-4 mr-2" />
                  )}
                  {t("sort.title", { ns: "journal" })}
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

        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
            {searchText && (
              <Badge variant="secondary">
                {t("search", { ns: "common" })}:
                <span className="ml-1">{searchText}</span>
              </Badge>
            )}
            {selectedPlant !== "all" && (
              <Badge variant="secondary">
                {t("filterByPlant", { ns: "journal" })}:{" "}
                {plants.find((p) => p.id === selectedPlant)?.name || "Plant"}
              </Badge>
            )}
            {selectedLogType !== "all" && (
              <Badge variant="secondary">
                {t("filterByType", { ns: "journal" })}:{" "}
                {t(`logType.${selectedLogType}`, { ns: "journal" })}
              </Badge>
            )}
            {selectedDate && (
              <Badge variant="secondary">
                {format(selectedDate, "PPP", { locale })}
              </Badge>
            )}
            <Button
              variant="link"
              size="sm"
              onClick={clearFilters}
              className="px-0"
            >
              {t("filters.clear", { ns: "journal" })} ({activeFiltersCount})
            </Button>
          </div>
        )}
      </div>

      <div className="p-2">
        <div className="text-sm text-muted-foreground mb-3">
          {filteredAndSortedLogs.length} {t("logsFound", { ns: "journal" })}
        </div>
        <JournalEntries logs={filteredAndSortedLogs} showPlantName />
      </div>

      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("filters.title", { ns: "journal" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
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

            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                {t("filters.clear", { ns: "journal" })} ({activeFiltersCount})
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
              locale={locale}
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

export function JournalDesktop(props: JournalDesktopProps) {
  return (
    <Suspense fallback={<JournalSkeleton />}>
      <JournalDesktopContent {...props} />
    </Suspense>
  );
}
