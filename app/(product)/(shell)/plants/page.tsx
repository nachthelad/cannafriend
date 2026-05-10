"use client";

import { useAuthUser } from "@/hooks/use-auth-user";
import { PlantContainer } from "@/components/plant/plant-container";

export default function PlantsListPage() {
  const { user } = useAuthUser();
  const userId = user?.uid ?? null;

  if (!user) {
    return null;
  }

  return <PlantContainer userId={userId!} />;
}
