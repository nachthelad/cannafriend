"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { db } from "@/lib/firebase";
import { plantDoc as plantDocRef, logsCol } from "@/lib/paths";
import {
  doc,
  getDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import {
  invalidateJournalCache,
  invalidatePlantsCache,
  invalidateDashboardCache,
  invalidatePlantDetails,
} from "@/lib/suspense-cache";
import { Plus } from "lucide-react";
import { JournalSkeleton } from "@/components/skeletons/journal-skeleton";
import { JournalEntries } from "@/components/journal/journal-entries";
import { getSuspenseResource } from "@/lib/suspense-utils";
import type { Plant, LogEntry } from "@/types";
import type {
  PlantLogsContainerProps,
  PlantLogsData,
} from "@/types/plants";
import { normalizePlant } from "@/lib/plant-utils";

async function fetchPlantData(
  userId: string,
  plantId: string
): Promise<PlantLogsData> {
  const plantSnap = await getDoc(plantDocRef(userId, plantId));

  if (!plantSnap.exists()) {
    throw new Error("Plant not found");
  }

  const plant = normalizePlant(plantSnap.data(), plantSnap.id);
  return { plant };
}

function PlantLogsContent({ userId, plantId }: PlantLogsContainerProps) {
  const { t } = useTranslation(["plants", "common", "journal"]);
  const router = useRouter();
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Get plant data from Suspense
  const cacheKey = `plant-${userId}-${plantId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchPlantData(userId, plantId)
  );
  const { plant } = resource.read();

  // Set up real-time logs subscription
  useEffect(() => {
    if (!userId || !plant) return;

    const logsQuery = query(
      logsCol(userId, plantId),
      orderBy("date", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LogEntry[];
      setLogs(logsData);
    });

    return () => unsubscribe();
  }, [userId, plantId, plant]);

  const handleDeleteLog = async (log: LogEntry) => {
    if (!userId || !log.id) return;
    try {
      await deleteDoc(
        doc(db, "users", userId, "plants", plantId, "logs", log.id)
      );

      // Invalidate caches to refresh journal, plants (for recent logs), and dashboard
      invalidateJournalCache(userId);
      invalidatePlantsCache(userId);
      invalidatePlantDetails(userId, plantId); // Individual plant page
      invalidateDashboardCache(userId);

      setLogs((prev) => prev.filter((l) => l.id !== log.id));
      toast({
        title: t("deleted", { ns: "journal" }),
        description: t("deletedDesc", { ns: "journal" }),
      });
    } catch (error: any) {
      handleFirebaseError(error, "delete log");
    }
  };

  const backHref = `/plants/${plantId}`;

  const handleAddLog = () => {
    router.push(`/plants/${plantId}/add-log`);
  };

  return (
    <div className="min-h-screen">
      <ResponsivePageHeader
        className="mb-4 sm:mb-6"
        title={t("viewLogs", { ns: "journal" })}
        description={
          <span>
            {t("logsFor", { ns: "journal" })} {plant.name}
          </span>
        }
        backHref={backHref}
        desktopActions={
          <Button size="icon" onClick={handleAddLog}>
            <Plus className="h-5 w-5" />
          </Button>
        }
        mobileControls={
          <div className="flex justify-end">
            <Button size="icon" onClick={handleAddLog}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        }
        sticky={false}
      />

      {/* Logs List */}
      <div className="px-4 pb-4">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <svg
                className="h-16 w-16 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t("noLogs", { ns: "journal" })}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t("addFirstLog", { ns: "journal" })}
            </p>
            <Button onClick={() => router.push(`/plants/${plantId}/add-log`)}>
              {t("addLog", { ns: "journal" })}
            </Button>
          </div>
        ) : (
          <JournalEntries
            logs={logs}
            showPlantName={false}
            onDelete={handleDeleteLog}
          />
        )}
      </div>
    </div>
  );
}

// Error boundary for plant not found
function PlantLogsErrorBoundary({ userId, plantId }: PlantLogsContainerProps) {
  const { t } = useTranslation(["plants", "common"]);
  const router = useRouter();

  return (
    <div className="text-center py-8">
      <h1 className="text-2xl font-bold mb-4">{t("plantPage.notFound")}</h1>
      <p className="text-muted-foreground mb-6">
        {t("plantPage.notFoundDesc")}
      </p>
      <Button onClick={() => router.push("/plants")}>
        {t("plantPage.backToDashboard")}
      </Button>
    </div>
  );
}

export function PlantLogsContainer({
  userId,
  plantId,
}: PlantLogsContainerProps) {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6">
          <JournalSkeleton />
        </div>
      }
    >
      <PlantLogsContent userId={userId} plantId={plantId} />
    </Suspense>
  );
}
