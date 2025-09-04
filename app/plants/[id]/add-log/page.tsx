"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { db } from "@/lib/firebase";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN } from "@/lib/routes";
import { plantDoc as plantDocRef } from "@/lib/paths";
import { doc, getDoc } from "firebase/firestore";
import { Layout } from "@/components/layout";
import { AddLogForm } from "@/components/journal/add-log-form";
import { ArrowLeft } from "lucide-react";
import { AnimatedLogo } from "@/components/common/animated-logo";
import type { Plant, LogEntry } from "@/types";

export default function AddLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t, i18n } = useTranslation(["plants", "common"]);
  const router = useRouter();
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(true);
  const [plant, setPlant] = useState<Plant | null>(null);
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchPlant = async () => {
      if (!userId) return;

      try {
        const plantSnap = await getDoc(plantDocRef(userId, id));
        if (!plantSnap.exists()) {
          toast({
            variant: "destructive",
            title: t("plantPage.notFound"),
            description: t("plantPage.notFoundDesc"),
          });
          router.push("/plants");
          return;
        }

        const plantData = { id: plantSnap.id, ...plantSnap.data() } as Plant;
        setPlant(plantData);
      } catch (error: any) {
        handleFirebaseError(error, "plant data fetch");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchPlant();
    }
  }, [userId, id, toast, t, router]);

  const handleLogSuccess = (newLog: LogEntry) => {
    toast({
      title: t("journal.logAdded"),
      description: t("journal.logAddedDesc"),
    });
    router.push(`/plants/${id}`);
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <AnimatedLogo size={32} className="text-primary" duration={1.5} />
        </div>
      </Layout>
    );
  }

  if (!plant) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold mb-4">{t("plantPage.notFound")}</h1>
          <p className="text-muted-foreground mb-6">{t("plantPage.notFoundDesc")}</p>
          <Button onClick={() => router.push("/plants")}>
            {t("plantPage.backToDashboard")}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Mobile Header */}
      <div className="md:hidden mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{t("journal.addLog")}</h1>
            <p className="text-sm text-muted-foreground">{plant.name}</p>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.back")}
          </Button>
        </div>
        <h1 className="text-3xl font-bold">{t("journal.addLog")}</h1>
        <p className="text-muted-foreground">
          {t("journal.addLogFor")} {plant.name}
        </p>
      </div>

      <AddLogForm
        plantId={id}
        onSuccess={handleLogSuccess}
        showPlantSelector={false}
        plants={[plant]}
      />
    </Layout>
  );
}