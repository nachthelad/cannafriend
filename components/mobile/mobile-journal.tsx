"use client";

import type {
  MobileJournalProps,
  MobileJournalSortBy,
  MobileJournalSortOrder,
} from "@/types/mobile";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { LocalizedCalendar as CalendarComponent } from "@/components/ui/calendar";
import Link from "next/link";
import {
  Filter,
  Plus,
  Calendar,
  X,
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
import { getSuspenseResource } from "@/lib/suspense-utils";
import { MobileSearchBar } from "@/components/mobile/mobile-search-bar";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { ROUTE_DASHBOARD } from "@/lib/routes";
import { fetchJournalData } from "@/lib/journal-data";
import { JournalEntrySkeleton } from "@/components/skeletons/journal-skeleton";
import { JournalEntries } from "@/components/journal/journal-entries";
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
import { DataErrorBoundary } from "@/components/common/data-error-boundary";

// Props for the inner content component — receives filter state from parent
interface MobileJournalContentProps {
  userId: string;
  language: string;
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  selectedPlant: string;
  onPlantChange: (plant: string) => void;
  selectedLogType: string;
  onLogTypeChange: (type: string) => void;
  showFilters: boolean;
  onShowFiltersChange: (show: boolean) => void;
  searchText: string;
  sortBy: MobileJournalSortBy;
  sortOrder: MobileJournalSortOrder;
  showCalendar: boolean;
  onShowCalendarChange: (show: boolean) => void;
  onSearchTextChange: (text: string) => void;
  activeFiltersCount: number;
  clearFilters: () => void;
}

function MobileJournalContent({
  userId,
  language,
  selectedDate,
  onDateChange,
  selectedPlant,
  onPlantChange,
  selectedLogType,
  onLogTypeChange,
  showFilters,
  onShowFiltersChange,
  searchText,
  sortBy,
  sortOrder,
  showCalendar,
  onShowCalendarChange,
  onSearchTextChange,
  activeFiltersCount,
  clearFilters,
}: MobileJournalContentProps) {
  const cacheKey = `mobile-journal-${userId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchJournalData(userId)
  );
  const { logs: initialLogs, plants } = resource.read();
  const { t } = useTranslation(["journal", "common"]);
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();

  // Local state for logs to support optimistic updates
  const [logs, setLogs] = useState(initialLogs);
  const [logToDelete, setLogToDelete] = useState<LogEntry | null>(null);

  // Sync when resource changes after cache invalidation
  if (logs !== initialLogs && logs.length === 0 && initialLogs.length > 0) {
    setLogs(initialLogs);
  }

  const getCalendarLocale = () => (language === "es" ? es : enUS);

  // Available log types from current logs
  const logTypes = [...new Set(logs.map((log) => log.type))];

  // Filter and sort logs
  const filteredAndSortedLogs = logs
    .filter((log) => {
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesNotes = log.notes?.toLowerCase().includes(searchLower);
        const matchesPlant = log.plantName?.toLowerCase().includes(searchLower);
        const matchesType = t(`logType.${log.type}`, { ns: "journal" })
          .toLowerCase()
          .includes(searchLower);
        if (!matchesNotes && !matchesPlant && !matchesType) return false;
      }
      if (selectedPlant !== "all" && (log as any).plantId !== selectedPlant) return false;
      if (selectedLogType !== "all" && log.type !== selectedLogType) return false;
      if (selectedDate && log.date) {
        if (!isSameDay(parseISO(log.date), selectedDate)) return false;
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

  const confirmDeleteLog = async () => {
    if (!userId || !logToDelete || !logToDelete.id) return;

    const log = logToDelete;
    setLogToDelete(null);

    const previousLogs = [...logs];
    setLogs((prev) => prev.filter((l) => l.id !== log.id));

    try {
      if (!log.plantId) throw new Error("Log missing plantId");

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

  return (
    <div className="space-y-4 px-4">
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
              onClick={() => onSearchTextChange("")}
            >
              "{searchText.slice(0, 15)}
              {searchText.length > 15 ? "..." : ""}"
              <X className="h-3 w-3" aria-hidden="true" />
            </Badge>
          )}
          {selectedPlant !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => onPlantChange("all")}
            >
              {plants.find((p) => p.id === selectedPlant)?.name || "Plant"}
              <X className="h-3 w-3" aria-hidden="true" />
            </Badge>
          )}
          {selectedLogType !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => onLogTypeChange("all")}
            >
              {t(`logType.${selectedLogType}`, { ns: "journal" })}
              <X className="h-3 w-3" aria-hidden="true" />
            </Badge>
          )}
          {selectedDate && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => onDateChange(undefined)}
            >
              {format(selectedDate, "MMM d", { locale: getCalendarLocale() })}
              <X className="h-3 w-3" aria-hidden="true" />
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
            onDelete={(log) => setLogToDelete(log)}
          />
        </div>
      ) : (
        <Card className="text-center py-8">
          <CardContent>
            <Calendar
              className="h-16 w-16 text-muted-foreground mx-auto mb-4"
              aria-hidden="true"
            />
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
              <Button asChild>
                <Link href="/journal/new">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addLog", { ns: "journal" })}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters Modal */}
      <Dialog open={showFilters} onOpenChange={onShowFiltersChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("filters.title", { ns: "journal" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">
                {t("filterByPlant", { ns: "journal" })}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedPlant === "all" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => onPlantChange("all")}
                >
                  {t("allPlants", { ns: "journal" })}
                </Badge>
                {plants.map((plant) => (
                  <Badge
                    key={plant.id}
                    variant={selectedPlant === plant.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => onPlantChange(plant.id)}
                  >
                    {plant.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">
                {t("filterByType", { ns: "journal" })}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedLogType === "all" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => onLogTypeChange("all")}
                >
                  {t("allTypes", { ns: "journal" })}
                </Badge>
                {logTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={selectedLogType === type ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => onLogTypeChange(type)}
                  >
                    {t(`logType.${type}`, { ns: "journal" })}
                  </Badge>
                ))}
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  clearFilters();
                  onShowFiltersChange(false);
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
      <Dialog open={showCalendar} onOpenChange={onShowCalendarChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("selectDate", { ns: "journal" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                onDateChange(date);
                onShowCalendarChange(false);
              }}
              locale={getCalendarLocale()}
              className="rounded-md border w-full"
            />
            {selectedDate && (
              <Button
                variant="outline"
                onClick={() => {
                  onDateChange(undefined);
                  onShowCalendarChange(false);
                }}
                className="w-full"
              >
                {t("clearDate", { ns: "journal" })}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

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

/**
 * Mobile Journal — filter state lives here (outside Suspense) so the sticky
 * header with controls renders immediately while entries are loading.
 */
export function MobileJournal({ userId, language, mobileActions }: MobileJournalProps) {
  const { t } = useTranslation(["journal", "common"]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedPlant, setSelectedPlant] = useState("all");
  const [selectedLogType, setSelectedLogType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState<MobileJournalSortBy>("date");
  const [sortOrder, setSortOrder] = useState<MobileJournalSortOrder>("desc");
  const [showCalendar, setShowCalendar] = useState(false);

  const activeFiltersCount = [
    selectedPlant !== "all",
    selectedLogType !== "all",
    selectedDate !== undefined,
    searchText.trim() !== "",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedPlant("all");
    setSelectedLogType("all");
    setSelectedDate(undefined);
    setSearchText("");
  };

  const filterRow = (
    <div className="flex items-center gap-2">
      {/* Search — first on the left */}
      <MobileSearchBar
        value={searchText}
        onChange={setSearchText}
        isOpen={isSearchOpen}
        onOpen={() => setIsSearchOpen(true)}
        onClose={() => setIsSearchOpen(false)}
        placeholder={t("searchPlaceholder", { ns: "journal" })}
      />

      {/* Filters Button */}
      <Button
        variant="outline"
        onClick={() => setShowFilters(true)}
        className="relative h-11 flex-1 max-w-32"
      >
        <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
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
        onClick={() => setShowCalendar(true)}
        className="h-11 px-3"
      >
        <Calendar className="h-4 w-4" aria-hidden="true" />
      </Button>

      {/* Sort Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-11 px-3">
            {sortOrder === "asc" ? (
              <SortAsc className="h-4 w-4" aria-hidden="true" />
            ) : (
              <SortDesc className="h-4 w-4" aria-hidden="true" />
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
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc"
              ? t("sort.descending", { ns: "journal" })
              : t("sort.ascending", { ns: "journal" })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      {/* Sticky mobile header — renders immediately, outside Suspense */}
      <ResponsivePageHeader
        className="md:hidden"
        title={t("title", { ns: "journal" })}
        description={t("description", { ns: "journal" })}
        backHref={ROUTE_DASHBOARD}
        mobileControls={filterRow}
        mobileActions={mobileActions}
      />

      {/* Entries — suspends while loading; only the list area shows skeleton */}
      <DataErrorBoundary>
        <Suspense
          fallback={
            <div className="space-y-4 px-4 pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <JournalEntrySkeleton key={i} />
              ))}
            </div>
          }
        >
          <MobileJournalContent
            userId={userId}
            language={language}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedPlant={selectedPlant}
            onPlantChange={setSelectedPlant}
            selectedLogType={selectedLogType}
            onLogTypeChange={setSelectedLogType}
            showFilters={showFilters}
            onShowFiltersChange={setShowFilters}
            searchText={searchText}
            sortBy={sortBy}
            sortOrder={sortOrder}
            showCalendar={showCalendar}
            onShowCalendarChange={setShowCalendar}
            onSearchTextChange={setSearchText}
            activeFiltersCount={activeFiltersCount}
            clearFilters={clearFilters}
          />
        </Suspense>
      </DataErrorBoundary>
    </>
  );
}
