"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ROUTE_JOURNAL } from "@/lib/routes";
import { Skeleton } from "@/components/ui/skeleton";

export default function AddLogRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!id) {
      return;
    }

    // Redirect to journal/new with plant preselected and return path
    router.replace(`${ROUTE_JOURNAL}/new?plantId=${id}&returnTo=plant`);
  }, [id, router]);

  // Show loading while redirecting
  return (
    <div className="p-6">
      <Skeleton className="h-12 w-48" />
    </div>
  );
}
