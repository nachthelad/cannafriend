"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  ROUTE_JOURNAL_NEW,
  ROUTE_PLANTS_NEW,
  ROUTE_DASHBOARD,
} from "@/lib/routes";
import { Plus } from "lucide-react";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { useHasPlants } from "@/hooks/use-has-plants";

// Dynamic imports for view components
const MobileJournal = dynamic(
  () => import("@/components/mobile/mobile-journal").then((mod) => mod.MobileJournal),
  { ssr: false }
);
const JournalDesktop = dynamic(
  () => import("@/components/journal/journal-desktop").then((mod) => mod.JournalDesktop),
  { ssr: false }
);

export default function JournalPage() {
  const { t, i18n } = useTranslation(["journal", "common", "plants"]);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;
  const homePath = ROUTE_DASHBOARD;
  const { hasPlants, isLoading: plantsLoading } = useHasPlants();

  if (!user || authLoading) {
    return null;
  }

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

  const mobileAddAction = (
    <Button
      size="icon"
      aria-label={addButtonLabel}
      onClick={handleAddClick}
      disabled={plantsLoading}
    >
      <Plus className="h-5 w-5" />
    </Button>
  );

  return (
    <>
      <div className="hidden md:block">
        <ResponsivePageHeader
          title={t("title", { ns: "journal" })}
          description={t("description", { ns: "journal" })}
          backHref={homePath}
          desktopActions={
            <Button onClick={handleAddClick} disabled={plantsLoading}>
              <Plus className="mr-2 h-4 w-4" />
              {addButtonLabel}
            </Button>
          }
        />
      </div>

      <Suspense fallback={null}>
        <div className="md:hidden">
          <MobileJournal
            userId={userId!}
            language={i18n.language}
            mobileActions={mobileAddAction}
          />
        </div>

        <div className="hidden md:block">
          <JournalDesktop userId={userId!} language={i18n.language} />
        </div>
      </Suspense>
    </>
  );
}
