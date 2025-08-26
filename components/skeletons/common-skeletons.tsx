"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" /> {/* Page title */}
          <Skeleton className="h-5 w-64" /> {/* Page description */}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" /> {/* Primary action */}
          <Skeleton className="h-10 w-32" /> {/* Secondary action */}
        </div>
      </div>
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" /> {/* Title */}
        <Skeleton className="h-5 w-5 rounded" /> {/* Icon */}
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-16 mb-1" /> {/* Value */}
        <Skeleton className="h-3 w-32" /> {/* Description */}
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          {/* Table header */}
          <div className="border-b bg-muted/50 px-6 py-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
          </div>
          
          {/* Table rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="border-b px-6 py-4 last:border-b-0">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton key={colIndex} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function FormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" /> {/* Form title */}
        <Skeleton className="h-4 w-48" /> {/* Form description */}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form fields */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" /> {/* Field label */}
            <Skeleton className="h-10 w-full" /> {/* Field input */}
          </div>
        ))}
        
        {/* Form actions */}
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-10 w-24" /> {/* Submit button */}
          <Skeleton className="h-10 w-20" /> {/* Cancel button */}
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" /> {/* Chart title */}
        <Skeleton className="h-4 w-48" /> {/* Chart description */}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart legend */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          
          {/* Chart area */}
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export function GallerySkeleton({ items = 8 }: { items?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square rounded-lg" /> {/* Image */}
          <Skeleton className="h-4 w-3/4" /> {/* Caption */}
        </div>
      ))}
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-3">
      <Skeleton className="h-12 w-12 rounded-lg" /> {/* Avatar/Icon */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" /> {/* Title */}
        <Skeleton className="h-3 w-48" /> {/* Subtitle */}
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16" /> {/* Action button */}
        <Skeleton className="h-8 w-8 rounded-full" /> {/* Menu button */}
      </div>
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="flex items-start space-x-3 p-4 border-b">
      <Skeleton className="h-8 w-8 rounded-full mt-1" /> {/* Icon */}
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" /> {/* Title */}
          <Skeleton className="h-3 w-16" /> {/* Time */}
        </div>
        <Skeleton className="h-4 w-full" /> {/* Message */}
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}