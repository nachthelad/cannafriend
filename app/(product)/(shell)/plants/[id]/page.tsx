"use client";

import { use } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { PlantDetailsContainer } from "@/components/plant/plant-details-container";

export default function PlantPage({
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

  return <PlantDetailsContainer userId={userId!} plantId={id} />;
}
