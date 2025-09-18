"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthUser } from "@/hooks/use-auth-user";
import { SettingsContainer } from "@/components/settings/settings-container";
import { MobileSettings } from "@/components/mobile/mobile-settings";
import { SettingsSkeleton } from "@/components/skeletons";
import { Layout } from "@/components/layout";
import { ROUTE_LOGIN } from "@/lib/routes";

export default function SettingsPage() {
  const { user, isLoading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.push(ROUTE_LOGIN);
    }
  }, [isLoading, user, router]);

  const providerId = user?.providerData?.[0]?.providerId ?? null;

  const skeletonFallback = (
    <div className="p-4 md:p-6">
      <SettingsSkeleton />
    </div>
  );

  // Show nothing while auth is loading - let Suspense handle all loading
  if (isLoading) {
    return <Layout><div /></Layout>;
  }

  // If not authenticated, redirect happens via useEffect
  if (!user) {
    return <Layout><div /></Layout>;
  }

  return (
    <Layout>
      {/* Mobile Settings */}
      <div className="md:hidden">
        <Suspense fallback={skeletonFallback}>
          <MobileSettings
            userId={user.uid}
            email={user.email}
            providerId={providerId}
          />
        </Suspense>
      </div>

      {/* Desktop Settings */}
      <div className="hidden md:block">
        <Suspense fallback={skeletonFallback}>
          <SettingsContainer
            userId={user.uid}
            email={user.email}
            providerId={providerId}
          />
        </Suspense>
      </div>
    </Layout>
  );
}
