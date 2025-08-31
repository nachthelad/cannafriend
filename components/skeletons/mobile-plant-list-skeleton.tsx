"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface MobilePlantListSkeletonProps {
  count?: number;
  viewMode?: "grid" | "list";
}

export function MobilePlantListSkeleton({
  count = 6,
  viewMode = "grid",
}: MobilePlantListSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-9 w-9 shrink-0" />
        </div>

        {/* Search and Controls Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="flex-1 h-11" />
          <Skeleton className="h-11 w-11" />
          <div className="flex rounded-md border">
            <Skeleton className="h-11 w-11 rounded-r-none" />
            <Skeleton className="h-11 w-11 rounded-l-none" />
          </div>
          <Skeleton className="h-11 w-11" />
        </div>
      </div>

      {/* Plant Cards Skeleton */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-2 gap-3"
            : "flex flex-col gap-3"
        }
      >
        {Array.from({ length: count }).map((_, index) => (
          <PlantCardSkeleton key={index} viewMode={viewMode} />
        ))}
      </div>
    </div>
  );
}

function PlantCardSkeleton({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden flex">
        {/* Image Skeleton */}
        <Skeleton className="w-20 h-20 shrink-0 rounded-l-lg" />
        
        {/* Plant Info Skeleton */}
        <div className="flex-1 p-4 flex flex-col justify-center space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Image Skeleton */}
      <div className="relative aspect-square w-full">
        <Skeleton className="h-full w-full" />
        {/* Overlay content skeleton */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/20 to-transparent p-3">
          <Skeleton className="h-4 w-24 mb-1 bg-white/30" />
          <Skeleton className="h-4 w-16 bg-white/30" />
        </div>
      </div>
    </Card>
  );
}