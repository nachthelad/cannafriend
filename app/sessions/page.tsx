"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layout } from "@/components/layout";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN } from "@/lib/routes";
import { SessionsContainer } from "@/components/sessions/sessions-container";
import { SessionsSkeleton } from "@/components/skeletons";
import { clearSuspenseCache } from "@/lib/suspense-utils";

interface RefreshHandlerProps {
  userId: string;
}

function RefreshHandler({ userId }: RefreshHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (userId && searchParams.get("refresh") === "true") {
      clearSuspenseCache(`sessions-${userId}`);
      // Clean up the URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("refresh");
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [userId, searchParams, router]);

  return null;
}

function SessionsContent() {
  const { user, isLoading: authLoading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.push(ROUTE_LOGIN);
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <>
      <Suspense fallback={null}>
        <RefreshHandler userId={user.uid} />
      </Suspense>
      <SessionsContainer userId={user.uid} />
    </>
  );
}

export default function SessionsPage() {
  return (
    <Layout>
      <SessionsContent />
    </Layout>
  );
}
