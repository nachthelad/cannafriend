"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      {/* Quick Actions Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" /> {/* Title */}
          <Skeleton className="h-4 w-64" /> {/* Description */}
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-10 w-32" /> {/* Button 1 */}
            <Skeleton className="h-10 w-28" /> {/* Button 2 */}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" /> {/* Title */}
              <Skeleton className="h-4 w-4 rounded-full" /> {/* Icon */}
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-12 mb-1" /> {/* Number */}
              <Skeleton className="h-3 w-24" /> {/* Description */}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Plants and Journal - Two column layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Plants Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" /> {/* Title */}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-16 rounded-lg" /> {/* Plant image */}
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" /> {/* Plant name */}
                    <Skeleton className="h-3 w-32" /> {/* Plant info */}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Journal Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" /> {/* Title */}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" /> {/* Date */}
                  <Skeleton className="h-3 w-full" /> {/* Entry text line 1 */}
                  <Skeleton className="h-3 w-3/4" /> {/* Entry text line 2 */}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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