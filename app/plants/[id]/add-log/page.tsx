"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTE_JOURNAL } from "@/lib/routes";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function AddLogRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirect to journal/new with plant preselected and return path
    router.replace(`${ROUTE_JOURNAL}/new?plantId=${id}&returnTo=plant`);
  }, [id, router]);

  // Show loading while redirecting
  return (
    <Layout>
      <div className="p-6">
        <Skeleton className="h-12 w-48" />
      </div>
    </Layout>
  );
}
