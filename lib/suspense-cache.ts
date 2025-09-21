// Cache invalidation utilities for Suspense data
import { clearSuspenseCache, clearSuspenseCacheByPrefix } from "./suspense-utils";

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

// Clear all user-specific caches (useful for logout)
export function invalidateUserCaches(userId: string) {
  invalidatePlantsCache(userId);
  invalidateJournalCache(userId);
  invalidateDashboardCache(userId);
}