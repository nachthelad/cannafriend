"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AILayout } from "@/components/layout/ai-layout";
import { UnifiedChat } from "@/components/ai/unified-chat";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useTranslation } from "@/hooks/use-translation";
import { usePremium } from "@/hooks/use-premium";
import { PremiumRequiredCard } from "@/components/common/premium-required-card";
import { ROUTE_LOGIN } from "@/lib/routes";
import { AnimatedLogo } from "@/components/common/animated-logo";

export default function AIAssistantPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading } = useAuthUser();
  const { isPremium } = usePremium();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(ROUTE_LOGIN);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <AILayout>
        <div className="flex justify-center items-center h-full">
          <AnimatedLogo size={32} className="text-primary" duration={1.5} />
        </div>
      </AILayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AILayout>
      {!isPremium ? (
        <div className="flex justify-center items-center h-full">
          <div className="max-w-md mx-auto">
            <PremiumRequiredCard />
          </div>
        </div>
      ) : (
        <UnifiedChat className="h-full" />
      )}
    </AILayout>
  );
}
