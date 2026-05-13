"use client";

import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardContainer } from "@/features/product/dashboard/components/dashboard-container";
import { useEffect } from "react";
import { trackReturnedWithin7Days } from "@/lib/analytics";

export default function DashboardPage() {
  const { user } = useAuthUser();
  const userId = user?.uid ?? null;

  useEffect(() => {
    if (userId) {
      trackReturnedWithin7Days(userId);
    }
  }, [userId]);

  if (!user) {
    return null;
  }

  return (
    <DashboardContainer
      userId={userId!}
      userEmail={user.email || ""}
    />
  );
}
