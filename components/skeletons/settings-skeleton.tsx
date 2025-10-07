import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="md:hidden space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-56" />
          <div className="flex gap-3 pt-1">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-36" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-2 text-center">
          <Skeleton className="h-4 w-40 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-[220px,minmax(0,1fr)] md:gap-8">
        <div className="flex flex-col space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <SettingsCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsCardSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
