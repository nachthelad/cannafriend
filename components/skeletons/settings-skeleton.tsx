import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 md:px-0 md:py-6 md:gap-8">
      {/* Mobile skeleton - unchanged */}
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

      {/* Desktop skeleton - two column layout */}
      <div className="hidden md:flex md:flex-row md:items-start md:gap-8">
        {/* Left sidebar navigation */}
        <div className="md:w-64 md:flex-shrink-0 md:self-start">
          <nav className="sticky top-24 space-y-1 border-r border-border p-2">
            {/* Regular sections - first 5 */}
            {Array.from({ length: 5 }).map((_, index) => {
              const isActive = index === 0;
              return (
                <div
                  key={index}
                  className={`rounded-md px-3 py-2 ${
                    isActive ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className={`h-5 ${isActive ? "w-20" : "w-24"}`} />
                    {isActive && (
                      <Skeleton className="h-2 w-2 rounded-full ml-2 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Separator before destructive action */}
            <div className="my-4 border-t border-border" />

            {/* Delete account section (destructive) - smaller width to indicate it's different */}
            <div className="rounded-md px-3 py-2">
              <Skeleton className="h-5 w-28" />
            </div>
          </nav>
        </div>

        {/* Right content area */}
        <div className="md:flex-1 min-w-0 space-y-6 md:space-y-8">
          {/* Account section skeleton */}
          <div className="space-y-2">
            {/* Section title */}
            <div>
              <Skeleton className="h-7 w-20" />
            </div>

            {/* Email with provider icon and log out button */}
            <div className="space-y-4 max-w-sm">
              {/* Email row with icon */}
              <div className="flex items-center gap-3 text-sm">
                {/* Provider icon skeleton (circular for Google) */}
                <Skeleton className="h-4 w-4 rounded-sm" />
                {/* Email text */}
                <Skeleton className="h-4 w-48" />
              </div>

              {/* Log out button */}
              <Skeleton className="h-10 w-28 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer skeleton - desktop only */}
      <footer className="hidden md:block mt-10 border-t border-border pt-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Skeleton className="h-4 w-16" />
          <span className="text-muted-foreground">|</span>
          <Skeleton className="h-4 w-20" />
        </div>
      </footer>
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
