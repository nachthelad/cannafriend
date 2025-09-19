"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layout } from "@/components/layout";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN } from "@/lib/routes";
import { SessionsContainer } from "@/components/sessions/sessions-container";
import { SessionsSkeleton } from "@/components/sessions/sessions-skeleton";
import { clearSuspenseCache } from "@/lib/suspense-utils";

export default function SessionsPage() {
  const { user, isLoading: authLoading } = useAuthUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.push(ROUTE_LOGIN);
    }
  }, [authLoading, user, router]);

  // Clear sessions cache when returning from creating a new session
  useEffect(() => {
    if (user && searchParams.get('refresh') === 'true') {
      clearSuspenseCache(`sessions-${user.uid}`);
      // Clean up the URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [user, searchParams, router]);

  if (authLoading || !user) {
    return (
      <Layout>
        <SessionsSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <SessionsContainer userId={user.uid} />
    </Layout>
  );
}
