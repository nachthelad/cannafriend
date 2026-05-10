"use client";

import { useAuthUser } from "@/hooks/use-auth-user";
import { StashContainer } from "@/components/stash/stash-container";

export default function StashPage() {
  const { user } = useAuthUser();
  const userId = user?.uid ?? null;

  if (!user) {
    return null;
  }

  return <StashContainer userId={userId!} />;
}
