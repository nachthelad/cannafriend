"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import {
  Plus,
  Filter,
  Search,
  X,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
} from "lucide-react";
import { PlantGrid } from "@/components/plant/plant-grid";
import { PlantListSkeleton } from "@/components/skeletons/plant-list-skeleton";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { plantsCol } from "@/lib/paths";
import { query, getDocs, orderBy } from "firebase/firestore";
import { ROUTE_PLANTS_NEW, resolveHomePathForRoles } from "@/lib/routes";
import { useUserRoles } from "@/hooks/use-user-roles";
import type { Plant } from "@/types";
import type {
  PlantContainerProps,
  PlantContainerData,
  ViewMode,
  SortBy,
  SortOrder,
} from "@/types/plants";
import { normalizePlant } from "@/lib/plant-utils";

async function fetchPlantsData(userId: string): Promise<PlantContainerData> {
  const q = query(plantsCol(userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const plants: Plant[] = [];

  snap.forEach((d) => {
    plants.push(normalizePlant(d.data(), d.id));
  });

  return { plants };
}

function PlantContainerContent({ userId }: PlantContainerProps) {
  const { t } = useTranslation(["plants", "common", "dashboard"]);
  const router = useRouter();
  const { roles } = useUserRoles();
  const homePath = resolveHomePathForRoles(roles);

  const cacheKey = `plants-container-${userId}`;
  const resource = getSuspenseResource(cacheKey, () => fetchPlantsData(userId));
  const { plants } = resource.read();

  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [seedTypeFilter, setSeedTypeFilter] = useState("all");
  const [growTypeFilter, setGrowTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [includeEnded, setIncludeEnded] = useState(false);

  // Get unique filter options from plants
  const seedTypes = [...new Set(plants.map((p) => p.seedType).filter(Boolean))];
  const growTypes = [...new Set(plants.map((p) => p.growType).filter(Boolean))];

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

  return (
    <>
      <ResponsivePageHeader
        className="mb-4 sm:mb-6"
        title={t("yourPlants", { ns: "dashboard" })}
        description={t("managementDesc", { ns: "plants" })}
        backHref={homePath}
        desktopActions={
          <Button asChild>
            <Link href={ROUTE_PLANTS_NEW}>
              <Plus className="h-4 w-4 mr-2" />
              {t("addPlant", { ns: "dashboard" })}
            </Link>
          </Button>
        }
        mobileActions={
          <Button size="icon" asChild>
            <Link href={ROUTE_PLANTS_NEW}>
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        }
        sticky={false}
      />
      <div className="md:hidden px-4 space-y-4 mb-6">
        {/* Search and Controls Row */}
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder", { ns: "plants" })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 h-11"
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

          {/* Filters Button */}
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

          {/* Status Toggle (desktop) */}
          <div className="hidden sm:flex items-center gap-2 h-11 rounded-md border border-border px-3">
            <span className="text-sm text-muted-foreground">
              {t("filters.showEnded", { ns: "plants" })}
            </span>
            <Switch
              checked={includeEnded}
              onCheckedChange={setIncludeEnded}
              aria-label={t("filters.showEnded", { ns: "plants" })}
            />
          </div>

          {/* View Mode Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="h-11 px-3"
          >
            {viewMode === "grid" ? (
              <List className="h-4 w-4" />
            ) : (
              <Grid3X3 className="h-4 w-4" />
            )}
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
                {t("sortByDate", { ns: "plants" })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                {t("sortByName", { ns: "plants" })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("seedType")}>
                {t("sortBySeedType", { ns: "plants" })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("growType")}>
                {t("sortByGrowType", { ns: "plants" })}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc"
                  ? t("descending", { ns: "common" })
                  : t("ascending", { ns: "common" })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Desktop Controls */}
      <div className="hidden md:block px-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4 mr-2" />
                ) : (
                  <SortDesc className="h-4 w-4 mr-2" />
                )}
                {t("sort", { ns: "common" })}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("date")}>
                {t("sortByDate", { ns: "plants" })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                {t("sortByName", { ns: "plants" })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("seedType")}>
                {t("sortBySeedType", { ns: "plants" })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("growType")}>
                {t("sortByGrowType", { ns: "plants" })}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc"
                  ? t("descending", { ns: "common" })
                  : t("ascending", { ns: "common" })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
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

      {/* Plant Grid with all filter props */}
      <div className="px-4 md:px-6">
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

            {/* Status Filter */}
            <div className="space-y-3">
              <p className="text-sm font-medium">
                {t("filters.showEndedTitle", { ns: "plants" })}
              </p>
              <div>
                <Switch
                  checked={includeEnded}
                  onCheckedChange={setIncludeEnded}
                  aria-label={t("filters.showEnded", { ns: "plants" })}
                />
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

function PlantContainerSkeleton() {
  return <PlantListSkeleton />;
}

export function PlantContainer({ userId }: PlantContainerProps) {
  return (
    <Suspense fallback={<PlantContainerSkeleton />}>
      <PlantContainerContent userId={userId} />
    </Suspense>
  );
}
