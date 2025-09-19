"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function SessionsSkeleton() {
  return (
    <>
      {/* Mobile Skeleton */}
      <div className="md:hidden min-h-screen ">
        {/* Header */}
        <div className="p-4 space-y-4 border-b border-slate-700">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2 w-full sm:w-auto">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 sm:w-80" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </>
  );
}
