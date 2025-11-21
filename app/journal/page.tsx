"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  ROUTE_LOGIN,
  ROUTE_JOURNAL_NEW,
  ROUTE_PLANTS_NEW,
  resolveHomePathForRoles,
} from "@/lib/routes";
import { Layout } from "@/components/layout";
import { MobileJournal } from "@/components/mobile/mobile-journal";
import { Plus } from "lucide-react";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { useUserRoles } from "@/hooks/use-user-roles";
import { JournalDesktop } from "@/components/journal/journal-desktop";
import { useHasPlants } from "@/hooks/use-has-plants";

export default function JournalPage() {
  const { t, i18n } = useTranslation(["journal", "common", "plants"]);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;
  const { roles } = useUserRoles();
  const homePath = resolveHomePathForRoles(roles);
  const { hasPlants, isLoading: plantsLoading } = useHasPlants();

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  const handleAddClick = () => {
    if (!hasPlants) {
      router.push(ROUTE_PLANTS_NEW);
    } else {
      router.push(ROUTE_JOURNAL_NEW);
    }
  };

  const addButtonLabel = !hasPlants
    ? t("emptyState.addPlant", { ns: "plants" })
    : t("addLog", { ns: "journal" });

  return (
    <Layout>
      <ResponsivePageHeader
        title={t("title", { ns: "journal" })}
        description={t("description", { ns: "journal" })}
        backHref={homePath}
        mobileActions={
          <Button
            size="icon"
            aria-label={addButtonLabel}
            onClick={handleAddClick}
            disabled={plantsLoading}
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
        desktopActions={
          <Button onClick={handleAddClick} disabled={plantsLoading}>
            <Plus className="h-4 w-4 mr-2" />
            {addButtonLabel}
          </Button>
        }
      />
      {/* Mobile Journal */}
      <div className="md:hidden">
        {userId && <MobileJournal userId={userId} language={i18n.language} />}
      </div>

      {/* Desktop Journal */}
      <div className="hidden md:block">
        {userId && <JournalDesktop userId={userId} language={i18n.language} />}
      </div>
    </Layout>
  );
}
