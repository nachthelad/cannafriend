"use client";

import { use } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { PlantLogsContainer } from "@/components/plant/plant-logs-container";

export default function PlantLogsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuthUser();
  const userId = user?.uid ?? null;

  if (!user) {
    return null;
  }

  return <PlantLogsContainer userId={userId!} plantId={id} />;
}
