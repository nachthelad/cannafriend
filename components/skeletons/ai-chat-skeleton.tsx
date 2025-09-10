"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function AIChatSkeleton() {
  return (
    <div className="flex h-full">
      {/* Reserve sidebar space on desktop without skeletonizing it */}
      <div className="hidden md:block w-64 border-r bg-card/0" />

      {/* Main chat column */}
      <div className="flex flex-1 flex-col h-full max-w-4xl mx-auto">
        {/* Center welcome block */}
        <div className="flex-1 p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Skeleton className="h-6 w-80 mx-auto mb-3" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>

            {/* A couple of message bubbles */}
            <div className="space-y-4">
              <div className="flex gap-3 max-w-3xl mr-auto">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1">
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
              <div className="flex gap-3 max-w-3xl ml-auto flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-primary/40" />
                <div className="flex-1">
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom input bar */}
        <div className="border-t p-4">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

