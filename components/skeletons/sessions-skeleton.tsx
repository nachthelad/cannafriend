"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function SessionsSkeleton() {
  return (
    <>
      {/* Mobile Skeleton */}
      <div className="md:hidden min-h-screen ">
        {/* List */}
        <div className="p-4 space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>

      {/* Desktop Skeleton */}
      <div className="hidden md:block space-y-4">
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </>
  );
}
