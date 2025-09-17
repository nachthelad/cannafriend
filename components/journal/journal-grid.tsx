"use client";

import { Suspense } from "react";
import { JournalEntries } from "@/components/journal/journal-entries";
import { JournalSkeleton } from "@/components/skeletons/journal-skeleton";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { plantsCol, logsCol } from "@/lib/paths";
import { query, getDocs, orderBy, limit, collectionGroup, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LogEntry, Plant } from "@/types";

interface JournalGridProps {
  userId: string;
  selectedPlant?: string;
  selectedLogType?: string;
  selectedDate?: Date;
  onDelete?: (log: LogEntry) => void;
}

interface JournalData {
  logs: LogEntry[];
  plants: Plant[];
}

async function fetchJournalData(userId: string): Promise<JournalData> {
  const LOGS_PAGE_SIZE = 25;

  // Fetch plants first
  const plantsQueryRef = query(plantsCol(userId));
  const plantsSnap = await getDocs(plantsQueryRef);

  const plants: Plant[] = [];
  plantsSnap.forEach((docSnap) => {
    plants.push({ id: docSnap.id, ...docSnap.data() } as Plant);
  });

  // Try collectionGroup for logs
  let logs: LogEntry[] = [];

  try {
    const logsGroup = collectionGroup(db, "logs");
    const cgQuery = query(
      logsGroup,
      where("userId", "==", userId),
      orderBy("date", "desc"),
      limit(LOGS_PAGE_SIZE)
    );
    const cgSnap = await getDocs(cgQuery);

    cgSnap.forEach((docSnap) => {
      const logData = docSnap.data();
      const plant = plants.find(p => p.id === logData.plantId);
      logs.push({
        id: docSnap.id,
        ...logData,
        plantName: plant?.name || 'Unknown Plant',
      } as LogEntry);
    });
  } catch (e) {
    // Fallback: fetch per-plant
    for (const plant of plants) {
      const lq = query(
        logsCol(userId, plant.id),
        orderBy("date", "desc"),
        limit(LOGS_PAGE_SIZE)
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

    // Sort by date desc
    logs.sort(
      (a, b) =>
        new Date(b.date as string).getTime() -
        new Date(a.date as string).getTime()
    );
  }

  return { logs, plants };
}

function JournalGridContent({ userId, selectedPlant, selectedLogType, selectedDate, onDelete }: JournalGridProps) {
  const cacheKey = `journal-${userId}`;
  const resource = getSuspenseResource(cacheKey, () => fetchJournalData(userId));
  const { logs, plants } = resource.read();

  // Apply filters
  let filteredLogs = logs;

  if (selectedPlant && selectedPlant !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.plantId === selectedPlant);
  }

  if (selectedLogType && selectedLogType !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.type === selectedLogType);
  }

  if (selectedDate) {
    const dateStr = selectedDate.toISOString().split('T')[0];
    filteredLogs = filteredLogs.filter(log => {
      const logDate = new Date(log.date as string).toISOString().split('T')[0];
      return logDate === dateStr;
    });
  }

  return (
    <JournalEntries
      logs={filteredLogs}
      showPlantName={true}
      onDelete={onDelete}
    />
  );
}

export function JournalGrid(props: JournalGridProps) {
  return (
    <Suspense fallback={<JournalSkeleton />}>
      <JournalGridContent {...props} />
    </Suspense>
  );
}