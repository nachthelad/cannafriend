"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { useAuthUser } from "@/hooks/use-auth-user";
import { SettingsContainer } from "@/components/settings/settings-container";
import { MobileSettings } from "@/components/mobile/mobile-settings";
import { SettingsSkeleton } from "@/components/skeletons";
import { Layout } from "@/components/layout";
import { ROUTE_LOGIN, ROUTE_DASHBOARD } from "@/lib/routes";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { DataErrorBoundary } from "@/components/common/data-error-boundary";

export default function SettingsPage() {
  const { user, isLoading } = useAuthUser();
  const router = useRouter();
  const { t } = useTranslation(["common"]);
  const homePath = ROUTE_DASHBOARD;

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
    <div className="p-4 md:px-0 md:py-6">
      <SettingsSkeleton />
    </div>
  );

  // Show skeleton immediately while auth loads so the skeleton becomes the LCP element
  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:px-0 md:py-6">
          <SettingsSkeleton />
        </div>
      </Layout>
    );
  }

  // If not authenticated, redirect happens via useEffect
  if (!user) {
    return <Layout><div /></Layout>;
  }

  return (
    <Layout>
      <ResponsivePageHeader
        title={t("settings.title")}
        description={t("settings.accountDesc")}
        backHref={homePath}
      />
      {/* Mobile Settings */}
      <div className="md:hidden">
        <DataErrorBoundary>
          <Suspense fallback={skeletonFallback}>
            <MobileSettings
              userId={user.uid}
              email={user.email}
              providerId={providerId}
              showHeader={false}
            />
          </Suspense>
        </DataErrorBoundary>
      </div>

      {/* Desktop Settings */}
      <div className="hidden md:block">
        <DataErrorBoundary>
          <Suspense fallback={skeletonFallback}>
            <SettingsContainer
              userId={user.uid}
              email={user.email}
              providerId={providerId}
              showHeader={false}
            />
          </Suspense>
        </DataErrorBoundary>
      </div>
    </Layout>
  );
}
