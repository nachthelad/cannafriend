"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { MobileDatePicker } from "@/components/ui/mobile-date-picker";
import { useRouter } from "next/navigation";
import {
  Filter,
  Plus,
  Calendar,
  X,
  ChevronDown,
  Search,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { AnimatedLogo } from "@/components/common/animated-logo";
import { parseISO, isSameDay, format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { Plant, LogEntry } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JournalEntries } from "@/components/journal/journal-entries";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MobileJournalProps {
  logs: LogEntry[];
  plants: Plant[];
  isLoading: boolean;
  hasMoreLogs: boolean;
  loadingMoreLogs: boolean;
  onLoadMore: () => void;
  onDeleteLog: (log: LogEntry) => void;
  onLogSuccess: (newLog: LogEntry) => void;
  language: string;
}

type SortBy = "date" | "type" | "plant";
type SortOrder = "asc" | "desc";

export function MobileJournal({
  logs,
  plants,
  isLoading,
  hasMoreLogs,
  loadingMoreLogs,
  onLoadMore,
  onDeleteLog,
  onLogSuccess,
  language,
}: MobileJournalProps) {
  const { t } = useTranslation(["journal", "common"]);
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedPlant, setSelectedPlant] = useState<string>("all");
  const [selectedLogType, setSelectedLogType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showCalendar, setShowCalendar] = useState(false);

  // Infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreCallbackRef = useCallback(
    (node: HTMLDivElement) => {
      if (loadingMoreLogs) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasMoreLogs && !loadingMoreLogs) {
          onLoadMore();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loadingMoreLogs, hasMoreLogs, onLoadMore]
  );

  // Filter and sort logs
  const filteredAndSortedLogs = logs
    .filter((log) => {
      // Text search
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesNotes = log.notes?.toLowerCase().includes(searchLower);
        const matchesPlant = log.plantName?.toLowerCase().includes(searchLower);
        const matchesType = t(`logType.${log.type}`, { ns: "journal" }).toLowerCase().includes(searchLower);
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


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <AnimatedLogo size={32} className="text-primary" duration={1.5} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{t("title", { ns: "journal" })}</h1>
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedLogs.length} {t("logsFound", { ns: "journal" })}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push("/journal/new")}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

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
                {sortOrder === "asc" ? t("sort.descending", { ns: "journal" }) : t("sort.ascending", { ns: "journal" })}
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
              "{searchText.slice(0, 15)}{searchText.length > 15 ? "..." : ""}"
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
            onDelete={onDeleteLog}
          />
          
          {/* Infinite Scroll Trigger */}
          {hasMoreLogs && (
            <div ref={loadMoreCallbackRef} className="flex justify-center py-6">
              {loadingMoreLogs && (
                <AnimatedLogo size={24} className="text-primary" duration={1.2} />
              )}
            </div>
          )}
        </div>
      ) : (
        <Card className="text-center py-8">
          <CardContent>
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">
              {activeFiltersCount > 0 ? t("noFilteredLogs", { ns: "journal" }) : t("noLogs", { ns: "journal" })}
            </CardTitle>
            <CardDescription className="mb-6">
              {activeFiltersCount > 0
                ? t("tryDifferentFilters", { ns: "journal" })
                : t("addFirstLog", { ns: "journal" })}
            </CardDescription>
            {activeFiltersCount === 0 && (
              <Button onClick={() => router.push("/journal/new")}>
                <Plus className="h-4 w-4 mr-2" /> {t("addLog", { ns: "journal" })}
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
            <MobileDatePicker
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setShowCalendar(false);
              }}
              locale={getCalendarLocale()}
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