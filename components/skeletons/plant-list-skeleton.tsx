"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PlantListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <Skeleton className="h-8 w-32 mb-2" /> {/* Title */}
          <Skeleton className="h-5 w-48" /> {/* Description */}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" /> {/* Filter button */}
          <Skeleton className="h-10 w-32" /> {/* Add plant button */}
        </div>
      </div>

      {/* Plant grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <PlantCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function PlantCardSkeleton() {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <Skeleton className="h-48 w-full" /> {/* Plant image */}
        <div className="absolute top-3 right-3">
          <Skeleton className="h-6 w-20 rounded-full" /> {/* Status badge */}
        </div>
        <div className="absolute bottom-3 left-3">
          <Skeleton className="h-8 w-8 rounded-full" /> {/* Menu button */}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" /> {/* Plant name */}
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16 rounded-full" /> {/* Type badge */}
              <Skeleton className="h-4 w-20 rounded-full" /> {/* Stage badge */}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-12" /> {/* Age label */}
              <Skeleton className="h-4 w-16" /> {/* Age value */}
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" /> {/* Last update label */}
              <Skeleton className="h-4 w-14" /> {/* Last update value */}
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-8 w-20" /> {/* View button */}
            <Skeleton className="h-8 w-8 rounded-full" /> {/* Options button */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlantDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" /> {/* Plant name */}
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" /> {/* Type */}
            <Skeleton className="h-5 w-20 rounded-full" /> {/* Status */}
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" /> {/* Edit button */}
          <Skeleton className="h-10 w-28" /> {/* Add log button */}
        </div>
      </div>

      {/* Image gallery */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" /> {/* Gallery title */}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats and logs in two columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {/* Plant info card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" /> {/* Info title */}
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {/* Recent logs */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" /> {/* Logs title */}
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Skeleton className="h-8 w-8 rounded-full mt-1" /> {/* Type icon */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-24" /> {/* Log type */}
                      <Skeleton className="h-4 w-16" /> {/* Date */}
                    </div>
                    <Skeleton className="h-4 w-full" /> {/* Description */}
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}