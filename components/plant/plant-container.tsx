"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import {
  Plus,
  Filter,
  Search,
  X,
  Grid3X3,
  List,
  ArrowUpDown,
} from "lucide-react";
import { MobileSearchBar } from "@/components/mobile/mobile-search-bar";
import { PlantGrid } from "@/components/plant/plant-grid";
import { PlantListSkeleton } from "@/components/skeletons/plant-list-skeleton";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { plantsCol } from "@/lib/paths";
import { query, getDocs, orderBy } from "firebase/firestore";
import { ROUTE_PLANTS_NEW } from "@/lib/routes";
import { ROUTE_DASHBOARD } from "@/lib/routes";
import type { Plant } from "@/types";
import type {
  PlantContainerProps,
  PlantContainerData,
  ViewMode,
  SortBy,
  SortOrder,
} from "@/types/plants";
import { normalizePlant } from "@/lib/plant-utils";
import { SEED_TYPES, GROW_TYPES } from "@/lib/plant-config";

function PlantContainerContent({ userId }: PlantContainerProps) {
  const { t } = useTranslation(["plants", "common", "dashboard"]);
  const router = useRouter();
  const homePath = ROUTE_DASHBOARD;

  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [seedTypeFilter, setSeedTypeFilter] = useState("all");
  const [growTypeFilter, setGrowTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [includeEnded, setIncludeEnded] = useState(false);

  // Use static filter options
  const seedTypes = Object.values(SEED_TYPES);
  const growTypes = Object.values(GROW_TYPES);

  // Count active filters
  const activeFiltersCount = [
    seedTypeFilter !== "all",
    growTypeFilter !== "all",
    searchTerm.trim() !== "",
    includeEnded,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSeedTypeFilter("all");
    setGrowTypeFilter("all");
    setSearchTerm("");
    setIncludeEnded(false);
  };

  const mobileControls = (
    <div className="space-y-4">
      {/* Controls Row */}
      <div className="flex items-center gap-2">
        {/* Search — first on the left */}
        <MobileSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          isOpen={isSearchOpen}
          onOpen={() => setIsSearchOpen(true)}
          onClose={() => setIsSearchOpen(false)}
          placeholder={t("searchPlaceholder", { ns: "plants" })}
        />

        {/* Filters Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(true)}
          className="relative h-11 px-3"
          aria-label={t("filters", { ns: "common" })}
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="h-11 px-3"
          aria-label={viewMode === "grid" ? t("listView", { ns: "common" }) : t("gridView", { ns: "common" })}
        >
          {viewMode === "grid" ? (
            <List className="h-4 w-4" />
          ) : (
            <Grid3X3 className="h-4 w-4" />
          )}
        </Button>

        {/* Sort Menu */}
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="!h-11 px-3 w-fit">
            <ArrowUpDown className="h-4 w-4" />
            <SelectValue placeholder={t("sort", { ns: "common" })} />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="date">
              {t("sortByDate", { ns: "plants" })}
            </SelectItem>
            <SelectItem value="name">
              {t("sortByName", { ns: "plants" })}
            </SelectItem>
            <SelectItem value="seedType">
              {t("sortBySeedType", { ns: "plants" })}
            </SelectItem>
            <SelectItem value="growType">
              {t("sortByGrowType", { ns: "plants" })}
            </SelectItem>
            <SelectSeparator />
            <div className="px-2 py-1.5 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {sortOrder === "asc"
                  ? t("descending", { ns: "common" })
                  : t("ascending", { ns: "common" })}
              </span>
              <Switch
                checked={sortOrder === "desc"}
                onCheckedChange={(checked) =>
                  setSortOrder(checked ? "desc" : "asc")
                }
              />
            </div>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("activeFilters", { ns: "common" })}:
          </span>
          {searchTerm && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => setSearchTerm("")}
            >
              "{searchTerm.slice(0, 15)}
              {searchTerm.length > 15 ? "..." : ""}"
              <X className="h-3 w-3" />
            </Badge>
          )}
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
          {includeEnded && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => setIncludeEnded(false)}
            >
              {t("status.ended", { ns: "plants" })}
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
              {t("clearAll", { ns: "common" })}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  const desktopControls = (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder", { ns: "plants" })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(true)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          {t("filters", { ns: "common" })}
          {activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        <div className="flex items-center gap-2 h-10 rounded-md border border-border px-3 bg-background">
          <span className="text-sm text-muted-foreground">
            {t("filters.showEnded", { ns: "plants" })}
          </span>
          <Switch
            checked={includeEnded}
            onCheckedChange={setIncludeEnded}
            aria-label={t("filters.showEnded", { ns: "plants" })}
          />
        </div>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="h-10 px-3 w-fit">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("sort", { ns: "common" })} />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="date">
              {t("sortByDate", { ns: "plants" })}
            </SelectItem>
            <SelectItem value="name">
              {t("sortByName", { ns: "plants" })}
            </SelectItem>
            <SelectItem value="seedType">
              {t("sortBySeedType", { ns: "plants" })}
            </SelectItem>
            <SelectItem value="growType">
              {t("sortByGrowType", { ns: "plants" })}
            </SelectItem>
            <SelectSeparator />
            <div className="px-2 py-1.5 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {sortOrder === "asc"
                  ? t("descending", { ns: "common" })
                  : t("ascending", { ns: "common" })}
              </span>
              <Switch
                checked={sortOrder === "desc"}
                onCheckedChange={(checked) =>
                  setSortOrder(checked ? "desc" : "asc")
                }
              />
            </div>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 border rounded-md p-1 bg-background">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 w-8 p-0"
            aria-label={t("gridView", { ns: "common" })}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 w-8 p-0"
            aria-label={t("listView", { ns: "common" })}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Desktop Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("activeFilters", { ns: "common" })}:
          </span>
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              {searchTerm}
              <button onClick={() => setSearchTerm("")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {seedTypeFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {t(`seedType.${seedTypeFilter}`, { ns: "plants" })}
              <button onClick={() => setSeedTypeFilter("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {growTypeFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {t(`growType.${growTypeFilter}`, { ns: "plants" })}
              <button onClick={() => setGrowTypeFilter("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {includeEnded && (
            <Badge variant="secondary" className="gap-1">
              {t("status.ended", { ns: "plants" })}
              <button onClick={() => setIncludeEnded(false)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {activeFiltersCount > 1 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              {t("clearAll", { ns: "common" })}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <ResponsivePageHeader
        title={t("yourPlants", { ns: "dashboard" })}
        description={t("managementDesc", { ns: "plants" })}
        backHref={homePath}
        mobileControls={mobileControls}
        desktopControls={desktopControls}
        desktopActions={
          <Button asChild>
            <Link href={ROUTE_PLANTS_NEW}>
              <Plus className="h-4 w-4 mr-2" />
              {t("addPlant", { ns: "dashboard" })}
            </Link>
          </Button>
        }
        mobileActions={
          <Button size="icon" asChild aria-label={t("addPlant", { ns: "dashboard" })}>
            <Link href={ROUTE_PLANTS_NEW}>
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        }
        sticky={true}
      />

      {/* Plant Grid with all filter props */}
      <div className="px-4 md:px-6 pt-6">
        <PlantGrid
          userId={userId}
          searchTerm={searchTerm}
          viewMode={viewMode}
          sortBy={sortBy}
          sortOrder={sortOrder}
          seedTypeFilter={seedTypeFilter}
          growTypeFilter={growTypeFilter}
          includeEnded={includeEnded}
        />
      </div>

      {/* Filters Modal */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("filters", { ns: "common" })}</DialogTitle>
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
                  {t("all", { ns: "common" })}
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
                  {t("all", { ns: "common" })}
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
                  clearFilters();
                  setShowFilters(false);
                }}
                className="w-full"
              >
                {t("clearAll", { ns: "common" })} ({activeFiltersCount})
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PlantContainer({ userId }: PlantContainerProps) {
  return <PlantContainerContent userId={userId} />;
}
