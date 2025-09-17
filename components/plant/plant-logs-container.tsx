"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Plus } from "lucide-react";
import { JournalSkeleton } from "@/components/skeletons/journal-skeleton";
import { JournalEntries } from "@/components/journal/journal-entries";
import { getSuspenseResource } from "@/lib/suspense-utils";
import type { Plant, LogEntry } from "@/types";

interface PlantLogsContainerProps {
  userId: string;
  plantId: string;
}

interface PlantLogsData {
  plant: Plant;
}

async function fetchPlantData(userId: string, plantId: string): Promise<PlantLogsData> {
  const plantSnap = await getDoc(plantDocRef(userId, plantId));

  if (!plantSnap.exists()) {
    throw new Error("Plant not found");
  }

  const plant = { id: plantSnap.id, ...plantSnap.data() } as Plant;
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
  const resource = getSuspenseResource(cacheKey, () => fetchPlantData(userId, plantId));
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

  const handleBack = () => {
    router.push(`/plants/${plantId}`);
  };

  const handleDeleteLog = async (log: LogEntry) => {
    if (!userId || !log.id) return;
    try {
      await deleteDoc(
        doc(db, "users", userId, "plants", plantId, "logs", log.id)
      );
      setLogs((prev) => prev.filter((l) => l.id !== log.id));
      toast({
        title: t("deleted", { ns: "journal" }),
        description: t("deletedDesc", { ns: "journal" }),
      });
    } catch (error: any) {
      handleFirebaseError(error, "delete log");
    }
  };

  return (
    <div className="min-h-screen">
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
              {t("viewLogs", { ns: "journal" })}
            </h1>
            <p className="text-sm text-muted-foreground">{plant.name}</p>
          </div>
          <Button
            size="icon"
            onClick={() => router.push(`/plants/${plantId}/add-log`)}
            className="ml-2"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

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
              {t("viewLogs", { ns: "journal" })}
            </h1>
            <p className="text-muted-foreground">
              {t("logsFor", { ns: "journal" })} {plant.name}
            </p>
          </div>
          <Button
            size="icon"
            onClick={() => router.push(`/plants/${plantId}/add-log`)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

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

export function PlantLogsContainer({ userId, plantId }: PlantLogsContainerProps) {
  return (
    <Suspense fallback={<div className="p-4 md:p-6"><JournalSkeleton /></div>}>
      <PlantLogsContent userId={userId} plantId={plantId} />
    </Suspense>
  );
}