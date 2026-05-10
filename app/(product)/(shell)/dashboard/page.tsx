"use client";

import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardContainer } from "@/features/product/dashboard/components/dashboard-container";

export default function DashboardPage() {
  const { user } = useAuthUser();
  const userId = user?.uid ?? null;

  if (!user) {
    return null;
  }

  return <DashboardContainer userId={userId!} userEmail={user.email || ""} />;
}
