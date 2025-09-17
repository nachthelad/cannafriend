"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN } from "@/lib/routes";
import { Layout } from "@/components/layout";
import { DashboardContainer } from "@/components/dashboard/dashboard-container";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <DashboardContainer userId={userId!} userEmail={user.email || ""} />
    </Layout>
  );
}