"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Mobile skeleton */}
      <div className="md:hidden space-y-6">
        {/* Reminder System Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>

        {/* Plants Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>

        {/* Journal Widget Skeleton */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop skeleton */}
      <div className="hidden md:block space-y-6">
        {/* Main Content Skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Plants Widget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-9 w-16" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Journal Widget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-9 w-16" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function PlantCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <Skeleton className="h-48 w-full" /> {/* Plant image */}
        <div className="absolute top-2 right-2">
          <Skeleton className="h-6 w-16 rounded-full" /> {/* Status badge */}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" /> {/* Plant name */}
          <Skeleton className="h-4 w-24" /> {/* Plant type */}
          <Skeleton className="h-4 w-40" /> {/* Last update */}
        </div>
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-4 w-16" /> {/* Age */}
          <Skeleton className="h-8 w-20" /> {/* Action button */}
        </div>
      </CardContent>
    </Card>
  );
}

export function JournalEntrySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" /> {/* Entry type */}
                <Skeleton className="h-3 w-32" /> {/* Date */}
              </div>
              <Skeleton className="h-6 w-6 rounded-full" /> {/* Icon */}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" /> {/* Content line 1 */}
              <Skeleton className="h-4 w-3/4" /> {/* Content line 2 */}
            </div>
            <div className="flex items-center justify-between mt-3">
              <Skeleton className="h-3 w-20" /> {/* Plant name */}
              <Skeleton className="h-8 w-16" /> {/* View button */}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
