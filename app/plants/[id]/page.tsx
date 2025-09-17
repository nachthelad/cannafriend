"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN } from "@/lib/routes";
import { Layout } from "@/components/layout";
import { PlantDetailsContainer } from "@/components/plant/plant-details-container";

export default function PlantPage({
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

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <PlantDetailsContainer userId={userId!} plantId={id} />
    </Layout>
  );
}
