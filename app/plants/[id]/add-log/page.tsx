"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTE_JOURNAL } from "@/lib/routes";
import { Layout } from "@/components/layout";
import { AnimatedLogo } from "@/components/common/animated-logo";

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
      <div className="flex items-center justify-center h-64">
        <AnimatedLogo size={32} className="text-primary" duration={1.5} />
      </div>
    </Layout>
  );
}