"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AILayout } from "@/components/layout/ai-layout";
import { UnifiedChat } from "@/components/ai/unified-chat";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useTranslation } from "react-i18next";
import { usePremium } from "@/hooks/use-premium";
import { PremiumRequiredCard } from "@/components/common/premium-required-card";
import { ROUTE_LOGIN } from "@/lib/routes";
import { AIChatSkeleton } from "@/components/skeletons/ai-chat-skeleton";

export default function AIAssistantPage() {
  const { t } = useTranslation(["analyzePlant", "common"]);
  const router = useRouter();
  const { user, isLoading } = useAuthUser();
  const { isPremium } = usePremium();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(ROUTE_LOGIN);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <AILayout>
        <AIChatSkeleton />
      </AILayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AILayout onToggleSidebar={handleToggleSidebar}>
      {!isPremium ? (
        <div className="flex justify-center items-center h-full">
          <div className="max-w-md mx-auto">
            <PremiumRequiredCard />
          </div>
        </div>
      ) : (
        <UnifiedChat
          className="h-full"
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />
      )}
    </AILayout>
  );
}
