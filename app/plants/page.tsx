"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  ROUTE_LOGIN,
  ROUTE_PLANTS_NEW,
  resolveHomePathForRoles,
} from "@/lib/routes";
import { useUserRoles } from "@/hooks/use-user-roles";
import { Plus, ArrowLeft } from "lucide-react";
import { PlantGrid } from "@/components/plant/plant-grid";
import { MobilePlantContainer } from "@/components/plant/mobile-plant-container";

export default function PlantsListPage() {
  const { t } = useTranslation(["plants", "common", "dashboard"]);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;
  const { roles } = useUserRoles();
  const [search, setSearch] = useState("");
  const handleBack = () => router.replace(resolveHomePathForRoles(roles));

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  return (
    <Layout>
      {/* Mobile Header */}
      <div className="md:hidden mb-4 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {t("yourPlants", { ns: "dashboard" })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("managementDesc", { ns: "plants" })}
            </p>
          </div>
          <Button size="icon" onClick={() => router.push(ROUTE_PLANTS_NEW)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Plant List - only show on mobile */}
      <div className="md:hidden">
        {userId && <MobilePlantContainer userId={userId} />}
      </div>

      {/* Desktop Plant List - only show on desktop */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="hidden md:block mb-6 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("back", { ns: "common" })}
            </Button>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">
                {t("yourPlants", { ns: "dashboard" })}
              </h1>
              <p className="text-muted-foreground">
                {t("managementDesc", { ns: "plants" })}
              </p>
            </div>
            <Button onClick={() => router.push(ROUTE_PLANTS_NEW)}>
              <Plus className="h-4 w-4 mr-2" />{" "}
              {t("addPlant", { ns: "dashboard" })}
            </Button>
          </div>
        </div>

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
