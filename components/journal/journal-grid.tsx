"use client";

import { Suspense } from "react";
import { JournalEntries } from "@/components/journal/journal-entries";
import { JournalSkeleton } from "@/components/skeletons/journal-skeleton";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { fetchJournalData } from "@/lib/journal-data";
import type { JournalGridProps } from "@/types";

function JournalGridContent({ userId, selectedPlant, selectedLogType, selectedDate, onDelete }: JournalGridProps) {
  const cacheKey = `journal-${userId}`;
  const resource = getSuspenseResource(cacheKey, () => fetchJournalData(userId));
  const { logs } = resource.read();

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
