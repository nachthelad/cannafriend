"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function JournalSkeleton() {
  return (
    <div className="space-y-6">
      {/* Mobile-friendly header skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center overflow-x-hidden">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-5 w-40 sm:w-56" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-28 sm:w-24" />
          <Skeleton className="h-10 w-36 sm:w-32" />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <JournalEntrySkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function JournalEntrySkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 h-[77px]">
        <div className="flex items-center gap-3 h-full">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-1 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="mt-2">
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
          <div className="hidden sm:block">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function JournalTimelineSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="relative">
          {/* Timeline line */}
          {i < 5 && (
            <div className="absolute left-6 top-12 w-0.5 h-20 bg-gray-200 dark:bg-gray-700" />
          )}

          <div className="flex gap-4">
            {/* Timeline dot */}
            <div className="relative">
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-28" /> {/* Title */}
                      <Skeleton className="h-4 w-36" /> {/* Subtitle */}
                    </div>
                    <Skeleton className="h-4 w-16" /> {/* Time */}
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function JournalDesktopSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-[320px_1fr]">
      {/* Left column: Filters + calendar */}
      <Card className="h-fit">
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
          {/* Calendar block */}
          <div className="mt-2">
            <Skeleton className="h-80 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Right column: Entries list */}
      <div className="space-y-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <JournalEntrySkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
