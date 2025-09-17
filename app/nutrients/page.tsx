"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN } from "@/lib/routes";
import { NutrientsContainer } from "@/components/nutrients/nutrients-container";

export default function NutrientsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <Layout>
      <NutrientsContainer userId={userId!} />
    </Layout>
  );
}