// Cache invalidation utilities for Suspense data
import { clearSuspenseCache } from "./suspense-utils";

// Clear cache when plants are added/updated/deleted
export function invalidatePlantsCache(userId: string) {
  clearSuspenseCache(`plants-${userId}`);
}

// Clear cache when journal entries are added/updated/deleted
export function invalidateJournalCache(userId: string) {
  clearSuspenseCache(`journal-${userId}`);
}

// Clear all user-specific caches (useful for logout)
export function invalidateUserCaches(userId: string) {
  invalidatePlantsCache(userId);
  invalidateJournalCache(userId);
}