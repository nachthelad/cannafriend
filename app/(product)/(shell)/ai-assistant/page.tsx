"use client";

import { Suspense, useState, useEffect } from "react";
import { AIChat } from "@/components/ai/chat";
import { useAuthUser } from "@/hooks/use-auth-user";
import { AIChatSkeleton } from "@/components/skeletons/ai-chat-skeleton";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { auth } from "@/lib/firebase";
import { DataErrorBoundary } from "@/components/common/data-error-boundary";
import { hasLocalPremiumOverride, resolvePremiumState } from "@/lib/premium-state";

async function fetchPremiumStatus(_userId: string): Promise<boolean> {
  const localOverride = hasLocalPremiumOverride();
  if (localOverride) {
    return true;
  }

  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdTokenResult(true);
      return resolvePremiumState(token.claims as any, localOverride).isPremium;
    } catch {
      return false;
    }
  }

  return false;
}

function AIAssistantContent({
  userId,
  sidebarOpen,
  onToggleSidebar,
}: {
  userId: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  // Get premium status from Suspense
  const cacheKey = `premium-${userId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchPremiumStatus(userId),
  );
  const isPremium = resource.read();

  return (
    <AIChat
      className="h-full"
      sidebarOpen={isPremium ? sidebarOpen : false}
      onToggleSidebar={isPremium ? onToggleSidebar : undefined}
      accessMode={isPremium ? "premium_chat" : "free_taste"}
    />
  );
}

export default function AIAssistantPage() {
  const { user } = useAuthUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Open sidebar by default on desktop only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      if (isDesktop) setSidebarOpen(true);
    }
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div className="h-full">
      <DataErrorBoundary>
        <Suspense fallback={<AIChatSkeleton />}>
          <AIAssistantContent
            userId={user.uid}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={handleToggleSidebar}
          />
        </Suspense>
      </DataErrorBoundary>
    </div>
  );
}
