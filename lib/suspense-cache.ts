// Cache invalidation utilities for Suspense data
import { clearSuspenseCache, clearSuspenseCacheByPrefix, updateSuspenseResource } from "./suspense-utils";
import type { LogEntry, Plant } from "@/types";
import type { JournalData } from "@/types";
import type { PlantGridData } from "@/types/plants";

// Clear cache when plants are added/updated/deleted
export function invalidatePlantsCache(userId: string) {
  clearSuspenseCache(`plants-${userId}`);           // Legacy - for any remaining usage
  clearSuspenseCache(`plants-grid-${userId}`);      // PlantGrid (desktop cards with recent logs)
  clearSuspenseCache(`plants-mobile-${userId}`);    // MobilePlantContainer
  clearSuspenseCache(`plants-container-${userId}`); // PlantContainer (main page)
}

// Clear cache for a specific plant's detail page
export function invalidatePlantDetails(userId: string, plantId: string) {
  clearSuspenseCache(`plant-details-${userId}-${plantId}`);
}

// Clear cache for all plant details (when we don't know which specific plant)
export function invalidateAllPlantDetails(userId: string) {
  clearSuspenseCacheByPrefix(`plant-details-${userId}-`);
}

// Clear cache when journal entries are added/updated/deleted
export function invalidateJournalCache(userId: string) {
  clearSuspenseCache(`journal-${userId}`);
}

// Clear cache when dashboard data changes (reminders, roles, etc.)
export function invalidateDashboardCache(userId: string) {
  clearSuspenseCache(`dashboard-${userId}`);
}

// Clear cache when reminders change
export function invalidateRemindersCache(userId: string) {
  clearSuspenseCache(`reminders-${userId}`);
}

// Clear cache when settings change (theme, timezone, roles, etc.)
export function invalidateSettingsCache(userId: string) {
  clearSuspenseCache(`settings-${userId}`);
}

// Clear all user-specific caches (useful for logout)
export function invalidateUserCaches(userId: string) {
  invalidatePlantsCache(userId);
  invalidateJournalCache(userId);
  invalidateDashboardCache(userId);
  invalidateRemindersCache(userId);
  invalidateSettingsCache(userId);
}

// Optimistically prepend a new log to journal caches so the list updates
// immediately without re-fetching from Firestore.
export function optimisticAddLog(userId: string, log: LogEntry) {
  const prepend = (data: JournalData): JournalData => ({
    ...data,
    logs: [log, ...data.logs],
  });
  updateSuspenseResource<JournalData>(`journal-${userId}`, prepend);
  updateSuspenseResource<JournalData>(`mobile-journal-${userId}`, prepend);
}

// Optimistically prepend a new plant to plant-grid cache so the list updates
// immediately without re-fetching from Firestore.
export function optimisticAddPlant(userId: string, plant: Plant) {
  updateSuspenseResource<PlantGridData>(`plants-grid-${userId}`, (data) => ({
    ...data,
    plants: [plant, ...data.plants],
  }));
}
