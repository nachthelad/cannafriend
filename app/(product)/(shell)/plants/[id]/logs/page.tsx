"use client";

import { useParams } from "next/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { PlantLogsContainer } from "@/components/plant/plant-logs-container";

export default function PlantLogsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthUser();
  const userId = user?.uid ?? null;

  if (!user || !id) {
    return null;
  }

  return <PlantLogsContainer userId={userId!} plantId={id} />;
}
