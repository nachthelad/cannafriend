"use client";

import { useState } from "react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { PlantGrid } from "@/components/plant/plant-grid";
import { PlantListSkeleton } from "@/components/skeletons/plant-list-skeleton";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { plantsCol, logsCol } from "@/lib/paths";
import { query, getDocs, orderBy } from "firebase/firestore";
import { Search, Filter, Grid3X3, List, SortAsc, SortDesc, X } from "lucide-react";
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
import type { Plant, LogEntry } from "@/types";

interface MobilePlantContainerProps {
  userId: string;
}

interface PlantData {
  plants: Plant[];
  lastWaterings: Record<string, LogEntry>;
  lastFeedings: Record<string, LogEntry>;
  lastTrainings: Record<string, LogEntry>;
}

async function fetchPlantsData(userId: string): Promise<PlantData> {
  const q = query(plantsCol(userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  const plants: Plant[] = [];
  for (const d of snap.docs) {
    const p = { id: d.id, ...d.data() } as Plant;
    plants.push(p);
  }

  // fetch last logs for all plants in parallel
  const lastWaterings: Record<string, LogEntry> = {};
  const lastFeedings: Record<string, LogEntry> = {};
  const lastTrainings: Record<string, LogEntry> = {};

  await Promise.all(
    snap.docs.map(async (d) => {
      try {
        const lq = query(logsCol(userId, d.id), orderBy("date", "desc"));
        const ls = await getDocs(lq);
        const all = ls.docs.map((x) => ({
          id: x.id,
          ...x.data(),
        })) as LogEntry[];

        const w = all.find((l) => l.type === "watering");
        const f = all.find((l) => l.type === "feeding");
        const tr = all.find((l) => l.type === "training");

        if (w) lastWaterings[d.id] = w;
        if (f) lastFeedings[d.id] = f;
        if (tr) lastTrainings[d.id] = tr;
      } catch {
        // ignore per-plant logs errors
      }
    })
  );

  return { plants, lastWaterings, lastFeedings, lastTrainings };
}

function MobilePlantContainerContent({ userId }: MobilePlantContainerProps) {
  const { t } = useTranslation(["plants", "common"]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "date" | "seedType" | "growType">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [seedTypeFilter, setSeedTypeFilter] = useState<string>("all");
  const [growTypeFilter, setGrowTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const cacheKey = `plants-${userId}`;
  const resource = getSuspenseResource(cacheKey, () => fetchPlantsData(userId));
  const { plants } = resource.read();

  // Get unique filter values from actual data
  const seedTypes = [...new Set(plants.map((p) => p.seedType))];
  const growTypes = [...new Set(plants.map((p) => p.growType))];

  // Count active filters
  const activeFiltersCount = [
    seedTypeFilter !== "all",
    growTypeFilter !== "all",
  ].filter(Boolean).length;

  return (
    <>
      {/* Mobile Search and Controls */}
      <div className="pb-4 space-y-3">
        {/* Search Bar and Controls Row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder", { ns: "plants" })}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(true)}
            className="relative h-11 px-3"
          >
            <Filter className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none px-3 h-11"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none px-3 h-11"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Sort Button */}
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
                {t("sort.byDate", { ns: "plants" })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                {t("sort.byName", { ns: "plants" })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("seedType")}>
                {t("sort.bySeedType", { ns: "plants" })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("growType")}>
                {t("sort.byGrowType", { ns: "plants" })}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc"
                  ? t("sort.descending", { ns: "plants" })
                  : t("sort.ascending", { ns: "plants" })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t("filters.active", { ns: "plants" })}:
            </span>
            {seedTypeFilter !== "all" && (
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer"
                onClick={() => setSeedTypeFilter("all")}
              >
                {t(`seedType.${seedTypeFilter}`, { ns: "plants" })}
                <X className="h-3 w-3" />
              </Badge>
            )}
            {growTypeFilter !== "all" && (
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer"
                onClick={() => setGrowTypeFilter("all")}
              >
                {t(`growType.${growTypeFilter}`, { ns: "plants" })}
                <X className="h-3 w-3" />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Plant Grid */}
      <PlantGrid
        userId={userId}
        searchTerm={search}
        viewMode={viewMode}
        sortBy={sortBy}
        sortOrder={sortOrder}
        seedTypeFilter={seedTypeFilter}
        growTypeFilter={growTypeFilter}
      />

      {/* Filters Dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("filters.title", { ns: "plants" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Seed Type Filter */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                {t("filters.seedType", { ns: "plants" })}
              </label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={seedTypeFilter === "all" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSeedTypeFilter("all")}
                >
                  {t("filters.all", { ns: "plants" })}
                </Badge>
                {seedTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={seedTypeFilter === type ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSeedTypeFilter(type)}
                  >
                    {t(`seedType.${type}`, { ns: "plants" })}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Grow Type Filter */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                {t("filters.growType", { ns: "plants" })}
              </label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={growTypeFilter === "all" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setGrowTypeFilter("all")}
                >
                  {t("filters.all", { ns: "plants" })}
                </Badge>
                {growTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={growTypeFilter === type ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setGrowTypeFilter(type)}
                  >
                    {t(`growType.${type}`, { ns: "plants" })}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setSeedTypeFilter("all");
                  setGrowTypeFilter("all");
                }}
                className="w-full"
              >
                {t("filters.clear", { ns: "plants" })} ({activeFiltersCount})
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MobilePlantContainer({ userId }: MobilePlantContainerProps) {
  return (
    <Suspense fallback={<PlantListSkeleton />}>
      <MobilePlantContainerContent userId={userId} />
    </Suspense>
  );
}