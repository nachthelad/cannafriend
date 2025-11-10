"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PlantListSkeleton() {
  return (
    <>
      {/* Mobile Controls Skeleton */}
      <div className="md:hidden px-4 space-y-4 mb-6">
        <div className="flex items-center gap-2">
          {/* Search Bar Skeleton */}
          <Skeleton className="h-11 flex-1 rounded-md" />
          {/* Filter, List, Sort buttons */}
          <Skeleton className="h-11 w-11 rounded-md" />
          <Skeleton className="h-11 w-11 rounded-md" />
          <Skeleton className="h-11 w-11 rounded-md" />
        </div>
      </div>

      {/* Desktop Controls Skeleton */}
      <div className="hidden md:block px-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-10 flex-1 max-w-md rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>

      {/* Plant grid */}
      <div className="px-4 md:px-6">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PlantCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}

export function PlantCardSkeleton() {
  return (
    <Card className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5">
      <div className="relative aspect-[4/3] sm:aspect-video">
        {/* Plant image skeleton - main background */}
        <Skeleton className="h-full w-full rounded-none" />
        
        {/* Dark gradient overlay at bottom to simulate text overlay area */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        
        {/* Plant name and badges overlay at bottom - using darker skeleton for visibility */}
        <div className="absolute bottom-2 left-2 right-2 z-10">
          {/* Plant name skeleton */}
          <div className="mb-2">
            <Skeleton className="h-6 w-28 bg-foreground/20" />
          </div>
          
          {/* Badges skeleton - pill-shaped */}
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-5 w-20 rounded-full bg-foreground/20" />
            <Skeleton className="h-5 w-16 rounded-full bg-foreground/20" />
          </div>
        </div>
      </div>
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