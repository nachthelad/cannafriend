"use client";

import { Suspense, useMemo } from "react";
import { PlantCard } from "@/components/plant/plant-card";
import { SimplePlantCard } from "@/components/mobile/simple-plant-card";
import { PlantListSkeleton } from "@/components/skeletons/plant-list-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { plantsCol, logsCol } from "@/lib/paths";
import { db } from "@/lib/firebase";
import {
  query,
  getDocs,
  orderBy,
  collectionGroup,
  where,
} from "firebase/firestore";
import Fuse from "fuse.js";
import { Leaf, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Plant, LogEntry } from "@/types";
import type {
  PlantGridProps,
  PlantGridData,
  ViewMode,
  SortBy,
  SortOrder,
} from "@/types/plants";
import { isPlantGrowing, normalizePlant } from "@/lib/plant-utils";
import { ROUTE_PLANTS_NEW } from "@/lib/routes";

async function fetchPlantsData(userId: string): Promise<PlantGridData> {
  // 1. Fetch all plants
  const q = query(plantsCol(userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  const plants: Plant[] = [];
  for (const d of snap.docs) {
    plants.push(normalizePlant(d.data(), d.id));
  }

  // 2. Fetch ALL logs for this user in one go (using the new index)
  const logsQuery = query(
    collectionGroup(db, "logs"),
    where("userId", "==", userId),
    orderBy("date", "desc")
  );

  const logsSnap = await getDocs(logsQuery);

  // 3. Map logs to plants in memory
  const lastWaterings: Record<string, LogEntry> = {};
  const lastFeedings: Record<string, LogEntry> = {};
  const lastTrainings: Record<string, LogEntry> = {};

  // Since logs are already sorted by date desc, the first one we encounter
  // for each type+plant combination is the latest one.
  logsSnap.forEach((doc) => {
    const log = { id: doc.id, ...doc.data() } as LogEntry;
    const plantId = log.plantId;

    if (!plantId) return;

    if (log.type === "watering" && !lastWaterings[plantId]) {
      lastWaterings[plantId] = log;
    } else if (log.type === "feeding" && !lastFeedings[plantId]) {
      lastFeedings[plantId] = log;
    } else if (log.type === "training" && !lastTrainings[plantId]) {
      lastTrainings[plantId] = log;
    }
  });

  return { plants, lastWaterings, lastFeedings, lastTrainings };
}

function PlantGridContent({
  userId,
  searchTerm,
  viewMode = "grid",
  sortBy = "date",
  sortOrder = "desc",
  seedTypeFilter = "all",
  growTypeFilter = "all",
  includeEnded = false,
}: PlantGridProps) {
  const { t } = useTranslation(["plants", "common"]);
  const cacheKey = `plants-grid-${userId}`;
  const resource = getSuspenseResource(cacheKey, () => fetchPlantsData(userId));
  const { plants, lastWaterings, lastFeedings, lastTrainings } =
    resource.read();

  const basePlants = useMemo(
    () => (includeEnded ? plants : plants.filter(isPlantGrowing)),
    [plants, includeEnded]
  );

  // Configure Fuse.js for intelligent search with Spanish translations
  const fuse = useMemo(() => {
    // Create searchable data with translations
    const searchableData = basePlants.map((plant) => ({
      ...plant,
      // Add Spanish translations for search
      seedTypeEs:
        plant.seedType === "autoflowering"
          ? "autofloreciente"
          : "fotoperiódica",
      growTypeEs: plant.growType === "indoor" ? "interior" : "exterior",
    }));

    return new Fuse(searchableData, {
      keys: [
        { name: "name", weight: 0.4 }, // Name has highest priority
        { name: "seedType", weight: 0.15 }, // Seed type English
        { name: "seedTypeEs", weight: 0.15 }, // Seed type Spanish
        { name: "growType", weight: 0.1 }, // Grow type English
        { name: "growTypeEs", weight: 0.1 }, // Grow type Spanish
        { name: "seedBank", weight: 0.1 }, // Seed bank has lowest priority
        { name: "lightSchedule", weight: 0.1 }, // Light schedule
      ],
      threshold: 0.3, // Allow some typos (0 = exact match, 1 = match anything)
      ignoreLocation: true, // Search entire string, not just beginning
      includeMatches: false, // Don't need to highlight matches for now
      minMatchCharLength: 2, // Require at least 2 characters to match
    });
  }, [basePlants]);

  // Apply filters and search
  let filtered = basePlants;

  // Intelligent search with Fuse.js
  if (searchTerm && searchTerm.trim().length >= 2) {
    const searchResults = fuse.search(searchTerm.trim());
    filtered = searchResults.map((result) => result.item);
  }

  // Seed type filter
  if (seedTypeFilter !== "all") {
    filtered = filtered.filter((plant) => plant.seedType === seedTypeFilter);
  }

  // Grow type filter
  if (growTypeFilter !== "all") {
    filtered = filtered.filter((plant) => plant.growType === growTypeFilter);
  }

  // Apply sorting
  filtered = [...filtered].sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sortBy) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case "date":
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      case "seedType":
        aVal = a.seedType;
        bVal = b.seedType;
        break;
      case "growType":
        aVal = a.growType;
        bVal = b.growType;
        break;
      default:
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
    }

    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Empty state
  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={Leaf}
        title={
          searchTerm || seedTypeFilter !== "all" || growTypeFilter !== "all"
            ? t("emptyState.noResults", { ns: "plants" })
            : t("emptyState.noPlants", { ns: "plants" })
        }
        description={
          searchTerm || seedTypeFilter !== "all" || growTypeFilter !== "all"
            ? t("emptyState.noResultsDesc", { ns: "plants" })
            : t("emptyState.noPlantsDesc", { ns: "plants" })
        }
        action={
          !searchTerm && seedTypeFilter === "all" && growTypeFilter === "all"
            ? {
                label: t("emptyState.addPlant", { ns: "plants" }),
                href: ROUTE_PLANTS_NEW,
                icon: Plus,
              }
            : undefined
        }
      />
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {filtered.map((plant) => (
          <SimplePlantCard
            key={plant.id}
            plant={plant}
            language="en" // Could be passed as prop if needed
            viewMode="list"
            variant="overlay"
            showGrowType
          />
        ))}
      </div>
    );
  }

  // Mobile grid view - use SimplePlantCard (compact squares)
  return (
    <>
      {/* Mobile grid - 2 columns */}
      <div className="md:hidden grid grid-cols-2 gap-4">
        {filtered.map((plant) => (
          <SimplePlantCard
            key={plant.id}
            plant={plant}
            language="en"
            viewMode="grid"
            variant="overlay"
            showGrowType
          />
        ))}
      </div>

      {/* Desktop grid - 2 columns (md), 3 columns (lg), 4 columns (xl+) */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((plant) => (
          <PlantCard
            key={plant.id}
            plant={plant}
            lastWatering={lastWaterings[plant.id]}
            lastFeeding={lastFeedings[plant.id]}
            lastTraining={lastTrainings[plant.id]}
            detailed={true}
          />
        ))}
      </div>
    </>
  );
}

export function PlantGrid(props: PlantGridProps) {
  return (
    <Suspense fallback={<PlantListSkeleton />}>
      <PlantGridContent {...props} />
    </Suspense>
  );
}
