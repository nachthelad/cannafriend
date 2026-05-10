"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { SessionsContainer } from "@/components/sessions/sessions-container";
import { clearSuspenseCache } from "@/lib/suspense-utils";
import { DataErrorBoundary } from "@/components/common/data-error-boundary";

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
  const { user } = useAuthUser();

  if (!user) {
    return null;
  }

  return (
    <>
      <DataErrorBoundary>
        <Suspense fallback={null}>
          <RefreshHandler userId={user.uid} />
        </Suspense>
      </DataErrorBoundary>
      <SessionsContainer userId={user.uid} />
    </>
  );
}

export default function SessionsPage() {
  return <SessionsContent />;
}
