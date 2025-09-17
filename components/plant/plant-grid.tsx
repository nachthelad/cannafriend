"use client";

import { Suspense } from "react";
import { PlantCard } from "@/components/plant-card";
import { SimplePlantCard } from "@/components/mobile/simple-plant-card";
import { PlantListSkeleton } from "@/components/skeletons/plant-list-skeleton";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { plantsCol, logsCol } from "@/lib/paths";
import { query, getDocs, orderBy } from "firebase/firestore";
import type { Plant, LogEntry } from "@/types";

interface PlantGridProps {
  userId: string;
  searchTerm?: string;
  viewMode?: "grid" | "list";
  sortBy?: "name" | "date" | "seedType" | "growType";
  sortOrder?: "asc" | "desc";
  seedTypeFilter?: string;
  growTypeFilter?: string;
}

interface PlantData {
  plants: Plant[];
  lastWaterings: Record<string, LogEntry>;
  lastFeedings: Record<string, LogEntry>;
  lastTrainings: Record<string, LogEntry>;
}

async function fetchPlantsData(userId: string): Promise<PlantData> {
  const PAGE_SIZE = 12;
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

function PlantGridContent({
  userId,
  searchTerm,
  viewMode = "grid",
  sortBy = "date",
  sortOrder = "desc",
  seedTypeFilter = "all",
  growTypeFilter = "all",
}: PlantGridProps) {
  const cacheKey = `plants-${userId}`;
  const resource = getSuspenseResource(cacheKey, () => fetchPlantsData(userId));
  const { plants, lastWaterings, lastFeedings, lastTrainings } =
    resource.read();

  // Apply filters and search
  let filtered = plants;

  // Search filter
  if (searchTerm) {
    filtered = filtered.filter(
      (plant) =>
        plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plant.seedBank?.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {filtered.map((plant) => (
          <SimplePlantCard
            key={plant.id}
            plant={plant}
            language="en" // Could be passed as prop if needed
            viewMode="list"
          />
        ))}
      </div>
    );
  }

  // Mobile grid view - use SimplePlantCard (compact squares)
  return (
    <>
      {/* Mobile grid */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        {filtered.map((plant) => (
          <SimplePlantCard
            key={plant.id}
            plant={plant}
            language="en"
            viewMode="grid"
          />
        ))}
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((plant) => (
          <PlantCard
            key={plant.id}
            plant={plant}
            lastWatering={lastWaterings[plant.id]}
            lastFeeding={lastFeedings[plant.id]}
            lastTraining={lastTrainings[plant.id]}
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
