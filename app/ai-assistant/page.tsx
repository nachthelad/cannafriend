"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AILayout } from "@/components/layout/ai-layout";
import { AIChat } from "@/components/ai/chat";
import { useAuthUser } from "@/hooks/use-auth-user";
import { PremiumRequiredCard } from "@/components/common/premium-required-card";
import { ROUTE_LOGIN } from "@/lib/routes";
import { AIChatSkeleton } from "@/components/skeletons/ai-chat-skeleton";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { auth } from "@/lib/firebase";

async function fetchPremiumStatus(_userId: string): Promise<boolean> {
  // Check localStorage flag first
  if (
    typeof window !== "undefined" &&
    localStorage.getItem("cf_premium") === "1"
  ) {
    return true;
  }

  if (auth.currentUser) {
    try {
      // Check Firebase custom claims
      const token = await auth.currentUser.getIdTokenResult(true);
      const claims = token.claims as any;
      const boolPremium = Boolean(claims?.premium);
      const until =
        typeof claims?.premium_until === "number" ? claims.premium_until : 0;
      const timePremium = until > Date.now();
      return Boolean(boolPremium || timePremium);
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
    fetchPremiumStatus(userId)
  );
  const isPremium = resource.read();

  return (
    <>
      {!isPremium ? (
        <div className="flex justify-center items-center h-full">
          <div className="max-w-md mx-auto">
            <PremiumRequiredCard />
          </div>
        </div>
      ) : (
        <AIChat
          className="h-full"
          sidebarOpen={sidebarOpen}
          onToggleSidebar={onToggleSidebar}
        />
      )}
    </>
  );
}

export default function AIAssistantPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Open sidebar by default on desktop only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      if (isDesktop) setSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(ROUTE_LOGIN);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <AILayout onToggleSidebar={handleToggleSidebar}>
        <AIChatSkeleton />
      </AILayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AILayout onToggleSidebar={handleToggleSidebar}>
      <Suspense fallback={<AIChatSkeleton />}>
        <AIAssistantContent
          userId={user.uid}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />
      </Suspense>
    </AILayout>
  );
}
