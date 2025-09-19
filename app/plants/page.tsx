"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  ROUTE_LOGIN,
  ROUTE_PLANTS_NEW,
  resolveHomePathForRoles,
} from "@/lib/routes";
import { useUserRoles } from "@/hooks/use-user-roles";
import { Plus } from "lucide-react";
import { PlantGrid } from "@/components/plant/plant-grid";
import { MobilePlantContainer } from "@/components/plant/mobile-plant-container";

export default function PlantsListPage() {
  const { t } = useTranslation(["plants", "common", "dashboard"]);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;
  const { roles } = useUserRoles();
  const [search, setSearch] = useState("");
  const homePath = resolveHomePathForRoles(roles);
  const handleBack = () => router.replace(homePath);
  const handleAddPlant = () => router.push(ROUTE_PLANTS_NEW);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  return (
    <Layout>
      <ResponsivePageHeader
        className="mb-4 sm:mb-6"
        title={t("yourPlants", { ns: "dashboard" })}
        description={t("managementDesc", { ns: "plants" })}
        backHref={homePath}
        onBackClick={handleBack}
        desktopActions={
          <Button onClick={handleAddPlant}>
            <Plus className="h-4 w-4 mr-2" />{" "}
            {t("addPlant", { ns: "dashboard" })}
          </Button>
        }
        mobileActions={
          <Button size="icon" onClick={handleAddPlant}>
            <Plus className="h-5 w-5" />
          </Button>
        }
        sticky={false}
      />

      {/* Mobile Plant List - only show on mobile */}
      <div className="md:hidden">
        {userId && <MobilePlantContainer userId={userId} />}
      </div>

      {/* Desktop Plant List - only show on desktop */}
      <div className="hidden md:block">
        <div className="mb-4">
          <Input
            placeholder={t("searchPlaceholder", { ns: "plants" })}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {userId && <PlantGrid userId={userId} searchTerm={search} />}
      </div>
    </Layout>
  );
}
