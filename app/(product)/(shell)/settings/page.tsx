"use client";

import { useTranslation } from "react-i18next";
import { useAuthUser } from "@/hooks/use-auth-user";
import { SettingsContainer } from "@/components/settings/settings-container";
import { MobileSettings } from "@/components/mobile/mobile-settings";
import { SettingsSkeleton } from "@/components/skeletons";
import { ROUTE_DASHBOARD } from "@/lib/routes";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { DataErrorBoundary } from "@/components/common/data-error-boundary";

export default function SettingsPage() {
  const { user, isLoading } = useAuthUser();
  const { t } = useTranslation(["common"]);
  const homePath = ROUTE_DASHBOARD;
  const providerId = user?.providerData?.[0]?.providerId ?? null;

  if (isLoading || !user) {
    return (
      <div className="p-4 md:px-0 md:py-6">
        <SettingsSkeleton />
      </div>
    );
  }

  return (
    <>
      <ResponsivePageHeader
        title={t("settings.title")}
        description={t("settings.accountDesc")}
        backHref={homePath}
      />

      <div className="md:hidden">
        <DataErrorBoundary>
          <MobileSettings
            userId={user.uid}
            email={user.email}
            providerId={providerId}
            showHeader={false}
          />
        </DataErrorBoundary>
      </div>

      <div className="hidden md:block">
        <DataErrorBoundary>
          <SettingsContainer
            userId={user.uid}
            email={user.email}
            providerId={providerId}
            showHeader={false}
          />
        </DataErrorBoundary>
      </div>
    </>
  );
}
