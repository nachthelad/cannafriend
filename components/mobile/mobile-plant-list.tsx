"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { ROUTE_PLANTS_NEW } from "@/lib/routes";
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  X,
} from "lucide-react";
import { AnimatedLogo } from "@/components/common/animated-logo";
import type { Plant, LogEntry } from "@/types";
import { PlantCard } from "@/components/plant/plant-card";
import { SimplePlantCard } from "@/components/mobile/simple-plant-card";
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
import { cn } from "@/lib/utils";

interface MobilePlantListProps {
  plants: Plant[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onRefresh?: () => void;
  language: string;
}

type ViewMode = "grid" | "list";
type SortBy = "name" | "date" | "seedType" | "growType";
type SortOrder = "asc" | "desc";

export function MobilePlantList({
  plants,
  isLoading,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onRefresh,
  language,
}: MobilePlantListProps) {
  const { t } = useTranslation(["plants", "common"]);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [seedTypeFilter, setSeedTypeFilter] = useState<string>("all");
  const [growTypeFilter, setGrowTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loadMoreTrigger, setLoadMoreTrigger] = useState<HTMLDivElement | null>(
    null
  );

  // Infinite scroll with Intersection Observer
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMoreCallbackRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isLoadingMore, hasMore, onLoadMore]
  );

  // Filter and sort plants
  const filteredAndSortedPlants = plants
    .filter((plant) => {
      // Search filter
      if (search && !plant.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      // Seed type filter
      if (seedTypeFilter !== "all" && plant.seedType !== seedTypeFilter) {
        return false;
      }
      // Grow type filter
      if (growTypeFilter !== "all" && plant.growType !== growTypeFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "date":
          comparison =
            new Date(a.plantingDate || a.createdAt).getTime() -
            new Date(b.plantingDate || b.createdAt).getTime();
          break;
        case "seedType":
          comparison = a.seedType.localeCompare(b.seedType);
          break;
        case "growType":
          comparison = a.growType.localeCompare(b.growType);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Get unique filter values
  const seedTypes = [...new Set(plants.map((p) => p.seedType))];
  const growTypes = [...new Set(plants.map((p) => p.growType))];

  // Active filters count
  const activeFiltersCount = [
    seedTypeFilter !== "all",
    growTypeFilter !== "all",
  ].filter(Boolean).length;

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
            <h1 className="text-2xl font-bold">{t("yourPlants", { ns: "dashboard" })}</h1>
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedPlants.length} {t("total", { ns: "plants" })}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push(ROUTE_PLANTS_NEW)}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search and Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder", { ns: "plants" })}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
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
                {sortOrder === "asc" ? t("sort.descending", { ns: "plants" }) : t("sort.ascending", { ns: "plants" })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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

      {/* Plants Grid/List */}
      {filteredAndSortedPlants.length > 0 ? (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-2 gap-3"
              : "flex flex-col gap-3"
          )}
        >
          {filteredAndSortedPlants.map((plant, index) => (
            <SimplePlantCard
              key={plant.id}
              plant={plant}
              language={language}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <CardContent>
            <Plus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">
              {search || activeFiltersCount > 0
                ? t("noResults", { ns: "plants" })
                : t("noPlants", { ns: "dashboard" })}
            </CardTitle>
            <CardDescription className="mb-6">
              {search || activeFiltersCount > 0
                ? t("tryDifferentSearch", { ns: "plants" })
                : t("noPlantDesc", { ns: "dashboard" })}
            </CardDescription>
            {!search && activeFiltersCount === 0 && (
              <Button asChild>
                <Button onClick={() => router.push(ROUTE_PLANTS_NEW)}>
                  <Plus className="h-4 w-4 mr-2" /> {t("addPlant", { ns: "dashboard" })}
                </Button>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && (
        <div
          ref={loadMoreCallbackRef}
          className="flex justify-center py-6"
        >
          {isLoadingMore && (
            <AnimatedLogo size={24} className="text-primary" duration={1.2} />
          )}
        </div>
      )}

      {/* Filters Modal */}
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
    </div>
  );
}