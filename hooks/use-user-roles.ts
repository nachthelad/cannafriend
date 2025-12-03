"use client";

/**
 * Hook that returns user roles.
 * @deprecated Role system has been removed. This hook now returns static values for backward compatibility.
 * All users have access to all features (grower and consumer).
 */
export function useUserRoles(): {
  roles: { grower: boolean; consumer: boolean } | null;
  isLoading: boolean;
} {
  // Return static values - all users have access to all features
  return {
    roles: { grower: true, consumer: true },
    isLoading: false,
  };
}
