"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function JournalSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <Skeleton className="h-8 w-32 mb-2" /> {/* Title */}
          <Skeleton className="h-5 w-56" /> {/* Description */}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" /> {/* Filter button */}
          <Skeleton className="h-10 w-32" /> {/* Add entry button */}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>

      {/* Journal entries */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <JournalEntrySkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function JournalEntrySkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Entry type icon */}
          <div className="mt-1">
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-24" /> {/* Entry type */}
                <Skeleton className="h-4 w-2 rounded-full" /> {/* Separator */}
                <Skeleton className="h-4 w-32" /> {/* Plant name */}
              </div>
              <Skeleton className="h-4 w-20" /> {/* Date */}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>

            {/* Tags and metadata */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" /> {/* Tag 1 */}
                <Skeleton className="h-6 w-20 rounded-full" /> {/* Tag 2 */}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-full" /> {/* Edit button */}
                <Skeleton className="h-8 w-8 rounded-full" /> {/* More button */}
              </div>
            </div>
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