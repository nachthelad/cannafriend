"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { toastSuccess } from "@/lib/toast-helpers";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useTranslation } from "react-i18next";
import { useUserRoles } from "@/hooks/use-user-roles";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { plantDoc as plantDocRef, logsCol } from "@/lib/paths";
import {
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { resolveHomePathForRoles } from "@/lib/routes";
import { PlantDetailSkeleton } from "@/components/skeletons/plant-list-skeleton";
import { PlantDetailsHeader } from "@/components/plant/plant-details-header";
import { PlantPhotoGallery } from "@/components/plant/plant-photo-gallery";
import { PlantEnvironmentCard } from "@/components/plant/plant-environment-card";
import {
  PlantLogsSummary,
  LastActivitiesSummary,
} from "@/components/plant/plant-logs-summary";
import { PlantDetails } from "@/components/plant/plant-details";
import { MobilePlantPage } from "@/components/mobile/mobile-plant-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  invalidateDashboardCache,
  invalidatePlantsCache,
  invalidateJournalCache,
  invalidatePlantDetails,
} from "@/lib/suspense-cache";
import type { Plant, LogEntry, EnvironmentData } from "@/types";

interface PlantDetailsContainerProps {
  userId: string;
  plantId: string;
}

interface PlantDetailsData {
  plant: Plant;
  logs: LogEntry[];
  environmentData: EnvironmentData[];
  lastWatering: LogEntry | null;
  lastFeeding: LogEntry | null;
  lastTraining: LogEntry | null;
  lastFlowering: LogEntry | null;
  lastEnvironmentFromLogs: LogEntry | undefined;
}

async function fetchPlantDetailsData(
  userId: string,
  plantId: string
): Promise<PlantDetailsData> {
  // Fetch plant details
  const plantRef = plantDocRef(userId, plantId);
  const plantSnap = await getDoc(plantRef);

  if (!plantSnap.exists()) {
    throw new Error("Plant not found");
  }

  const plant = { id: plantSnap.id, ...plantSnap.data() } as Plant;

  // Fetch logs
  const logsRef = logsCol(userId, plantId);
  const logsQuery = query(logsRef, orderBy("date", "desc"));
  const logsSnap = await getDocs(logsQuery);

  const logs: LogEntry[] = [];
  logsSnap.forEach((doc) => {
    logs.push({ id: doc.id, ...doc.data() } as LogEntry);
  });

  // Compute last actions from logs
  const wateringLogs = logs.filter((log) => log.type === "watering");
  const feedingLogs = logs.filter((log) => log.type === "feeding");
  const trainingLogs = logs.filter((log) => log.type === "training");
  const floweringLogs = logs.filter((log) => log.type === "flowering");

  const lastWatering = wateringLogs[0] || null;
  const lastFeeding = feedingLogs[0] || null;
  const lastTraining = trainingLogs[0] || null;
  const lastFlowering = floweringLogs[0] || null;

  // Get latest environment data from journal logs
  const environmentLogs = logs.filter(
    (log) =>
      log.type === "environment" &&
      log.temperature != null &&
      log.humidity != null
  );
  const lastEnvironmentFromLogs =
    environmentLogs.length > 0 ? environmentLogs[0] : undefined;

  // Fetch environment data collection
  const envRef = collection(
    db,
    "users",
    userId,
    "plants",
    plantId,
    "environment"
  );
  const envQuery = query(envRef, orderBy("date", "desc"));
  const envSnap = await getDocs(envQuery);

  const environmentData: EnvironmentData[] = [];
  envSnap.forEach((doc) => {
    environmentData.push({ id: doc.id, ...doc.data() } as EnvironmentData);
  });

  return {
    plant,
    logs,
    environmentData,
    lastWatering,
    lastFeeding,
    lastTraining,
    lastFlowering,
    lastEnvironmentFromLogs,
  };
}

function PlantDetailsContent({ userId, plantId }: PlantDetailsContainerProps) {
  const { t, i18n } = useTranslation(["plants", "common", "journal"]);
  const router = useRouter();
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();
  const { roles } = useUserRoles();

  const cacheKey = `plant-details-${userId}-${plantId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchPlantDetailsData(userId, plantId)
  );

  const {
    plant: initialPlant,
    logs: initialLogs,
    environmentData,
    lastWatering,
    lastFeeding,
    lastTraining,
    lastFlowering,
    lastEnvironmentFromLogs,
  } = resource.read();

  const [plant, setPlant] = useState<Plant>(initialPlant);
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update local state when Suspense data changes
  useEffect(() => {
    setPlant(initialPlant);
    setLogs(initialLogs);
  }, [initialPlant, initialLogs]);

  const handleDeletePlant = async () => {
    if (!userId) return;
    setIsDeleting(true);

    try {
      // Delete subcollection docs: logs
      const logsRef = logsCol(userId, plantId);
      const logsSnap = await getDocs(logsRef);
      for (const d of logsSnap.docs) {
        await deleteDoc(d.ref);
      }

      // Delete subcollection docs: environment
      const envRef = collection(
        db,
        "users",
        userId,
        "plants",
        plantId,
        "environment"
      );
      const envSnap = await getDocs(envRef);
      for (const d of envSnap.docs) {
        await deleteDoc(d.ref);
      }

      // Delete plant document
      await deleteDoc(plantDocRef(userId, plantId));

      // Invalidate caches to refresh plants list and dashboard count
      invalidatePlantsCache(userId);
      invalidateDashboardCache(userId);

      router.push(resolveHomePathForRoles(roles));
    } catch (error: any) {
      handleFirebaseError(error, "delete plant");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!userId) return;
    try {
      await deleteDoc(
        doc(db, "users", userId, "plants", plantId, "logs", logId)
      );

      // Invalidate caches to refresh journal, plants (for recent logs), and dashboard
      invalidateJournalCache(userId);
      invalidatePlantsCache(userId);
      invalidatePlantDetails(userId, plantId);
      invalidateDashboardCache(userId);

      const updated = logs.filter((l) => l.id !== logId);
      setLogs(updated);
      toastSuccess(toast, t, {
        namespace: "journal",
        titleKey: "deleted",
        descriptionKey: "deletedDesc",
      });
    } catch (error: any) {
      handleFirebaseError(error, "delete log");
    }
  };

  const handlePhotosChange = async (newPhotos: string[]) => {
    if (!userId) return;
    try {
      const updated = [...(plant.photos || []), ...newPhotos];
      await updateDoc(plantDocRef(userId, plantId), { photos: updated });

      setPlant((prev) => ({ ...prev, photos: updated }));

      // Auto-set first photo as cover if no cover exists
      if (!plant.coverPhoto && updated.length > 0) {
        await updateDoc(plantDocRef(userId, plantId), {
          coverPhoto: updated[0],
        });
        setPlant((prev) => ({ ...prev, coverPhoto: updated[0] }));
      }

      invalidatePlantDetails(userId, plantId);
      invalidatePlantsCache(userId);

      toastSuccess(toast, t, {
        namespace: "plants",
        titleKey: "photos.uploadSuccess",
        descriptionKey: "photos.photosUpdated",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("photos.uploadError", { ns: "plants" }),
        description: error.message,
      });
    }
  };

  const handleRemovePhoto = async (index: number) => {
    if (!userId || !plant) return;

    // Get all available images
    const allImages = [
      ...(plant?.coverPhoto ? [plant.coverPhoto] : []),
      ...(plant.photos || []),
    ].filter((img, i, arr) => arr.indexOf(img) === i);

    const photoToRemove = allImages[index];
    const isRemovingCover = photoToRemove === plant?.coverPhoto;

    try {
      const newPhotos = (plant.photos || []).filter((p) => p !== photoToRemove);
      let newCoverPhoto = plant?.coverPhoto;

      // If removing cover photo, set new cover
      if (isRemovingCover) {
        newCoverPhoto = newPhotos[0] || "";
      }

      // Update the document
      await updateDoc(plantDocRef(userId, plantId), {
        photos: newPhotos,
        ...(isRemovingCover && { coverPhoto: newCoverPhoto }),
      });

      // Update local state
      setPlant((prev) => ({
        ...prev,
        photos: newPhotos,
        coverPhoto: newCoverPhoto,
      }));

      invalidatePlantDetails(userId, plantId);
      invalidatePlantsCache(userId);

    } catch (error: any) {
      handleFirebaseError(error, "remove photo");
    }
  };

  const handleSetCoverPhoto = async (photoUrl: string) => {
    if (!userId) return;
    try {
      await updateDoc(plantDocRef(userId, plantId), {
        coverPhoto: photoUrl,
      });

      setPlant((prev) => ({ ...prev, coverPhoto: photoUrl }));

      invalidatePlantDetails(userId, plantId);
      invalidatePlantsCache(userId);

    } catch (error: any) {
      handleFirebaseError(error, "set cover photo");
    }
  };

  if (!plant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("plantPage.notFound")}</CardTitle>
          <CardDescription>{t("plantPage.notFoundDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push(resolveHomePathForRoles(roles))}>
            {t("plantPage.backToDashboard")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile Plant Page */}
      <div className="md:hidden">
        <MobilePlantPage
          plant={plant}
          userId={userId}
          lastWatering={lastWatering || undefined}
          lastFeeding={lastFeeding || undefined}
          lastTraining={lastTraining || undefined}
          lastEnvironment={lastEnvironmentFromLogs}
          onAddPhoto={async () => {
            // Mobile photo upload would need implementation
            // For now, redirect to desktop or implement mobile gallery
          }}
          onRemovePhoto={handleRemovePhoto}
          onSetCoverPhoto={handleSetCoverPhoto}
          onUpdate={(patch) => setPlant((prev) => ({ ...prev, ...patch }))}
          language={i18n.language}
        />
      </div>

      {/* Desktop Plant Page */}
      <div className="hidden md:block space-y-6">
        {/* Header */}
        <PlantDetailsHeader
          plant={plant}
          plantId={plantId}
          onDelete={handleDeletePlant}
          isDeleting={isDeleting}
        />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column: Photo Gallery */}
          <div className="space-y-6">
            <PlantPhotoGallery
              plant={plant}
              onPhotosChange={handlePhotosChange}
              onRemovePhoto={handleRemovePhoto}
              onSetCoverPhoto={handleSetCoverPhoto}
            />
          </div>

          {/* Right Column: Plant Details & Environment */}
          <div className="space-y-6">
            <PlantDetails
              plant={plant}
              userId={userId}
              lastWatering={lastWatering || undefined}
              lastFeeding={lastFeeding || undefined}
              lastTraining={lastTraining || undefined}
              lastFlowering={lastFlowering || undefined}
              onUpdate={(patch) => setPlant((prev) => ({ ...prev, ...patch }))}
            />

            <PlantEnvironmentCard
              environmentData={environmentData}
              lastEnvironmentFromLogs={lastEnvironmentFromLogs}
            />
            {/* Last Activities Summary */}
            {/* <LastActivitiesSummary
              lastWatering={lastWatering || undefined}
              lastFeeding={lastFeeding || undefined}
              lastTraining={lastTraining || undefined}
              lastFlowering={lastFlowering || undefined}
            /> */}
          </div>
        </div>

        {/* Logs Registry */}
        <PlantLogsSummary
          plantId={plantId}
          logs={logs}
          lastWatering={lastWatering || undefined}
          lastFeeding={lastFeeding || undefined}
          lastTraining={lastTraining || undefined}
          lastFlowering={lastFlowering || undefined}
          onDeleteLog={handleDeleteLog}
        />
      </div>
    </>
  );
}

// Error boundary for plant not found
function PlantDetailsErrorBoundary({
  userId,
  plantId,
}: PlantDetailsContainerProps) {
  const { t } = useTranslation(["plants", "common"]);
  const router = useRouter();
  const { roles } = useUserRoles();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("plantPage.notFound")}</CardTitle>
        <CardDescription>{t("plantPage.notFoundDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => router.push(resolveHomePathForRoles(roles))}>
          {t("plantPage.backToDashboard")}
        </Button>
      </CardContent>
    </Card>
  );
}

export function PlantDetailsContainer({
  userId,
  plantId,
}: PlantDetailsContainerProps) {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6">
          <PlantDetailSkeleton />
        </div>
      }
    >
      <PlantDetailsContent userId={userId} plantId={plantId} />
    </Suspense>
  );
}

