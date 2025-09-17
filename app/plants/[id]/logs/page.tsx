"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN } from "@/lib/routes";
import { Layout } from "@/components/layout";
import { PlantLogsContainer } from "@/components/plant/plant-logs-container";

export default function PlantLogsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-6">
          <div className="space-y-4">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="space-y-3">
              <div className="h-24 w-full bg-muted rounded animate-pulse" />
              <div className="h-24 w-full bg-muted rounded animate-pulse" />
              <div className="h-24 w-full bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <PlantLogsContainer userId={userId!} plantId={id} />
    </Layout>
  );
}
