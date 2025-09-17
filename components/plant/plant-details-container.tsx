"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useUserRoles } from "@/hooks/use-user-roles";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { plantDoc as plantDocRef, logsCol } from "@/lib/paths";
import {
  getDoc,
  collection,
  query,
  orderBy,
  getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { resolveHomePathForRoles } from "@/lib/routes";
import { PlantDetailSkeleton } from "@/components/skeletons/plant-list-skeleton";
import { PlantDetails } from "@/components/plant/plant-details";
import { JournalEntries } from "@/components/journal/journal-entries";
import { MobilePlantPage } from "@/components/mobile/mobile-plant-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/common/image-upload";
import { DEFAULT_MAX_IMAGES, DEFAULT_MAX_SIZE_MB } from "@/lib/image-config";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useState } from "react";
import { updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Trash2, Plus, Star, ArrowLeft } from "lucide-react";
import { ROUTE_JOURNAL, ROUTE_PLANTS } from "@/lib/routes";
import type { Plant, LogEntry, EnvironmentData } from "@/types";

const EnvironmentChart = dynamic(
  () =>
    import("@/components/plant/environment-chart").then((mod) => ({
      default: mod.EnvironmentChart,
    })),
  {
    loading: () => (
      <div className="flex justify-center py-8">
        <div className="text-primary">Loading chart...</div>
      </div>
    ),
    ssr: false,
  }
);

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

async function fetchPlantDetailsData(userId: string, plantId: string): Promise<PlantDetailsData> {
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
  const lastEnvironmentFromLogs = environmentLogs.length > 0 ? environmentLogs[0] : undefined;

  // Fetch environment data collection
  const envRef = collection(db, "users", userId, "plants", plantId, "environment");
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
  const { t, i18n } = useTranslation(["plants", "common"]);
  const router = useRouter();
  const { toast } = useToast();
  const { roles } = useUserRoles();

  // Local state for UI interactions
  const [photos, setPhotos] = useState<string[]>([]);
  const [coverPhoto, setCoverPhoto] = useState<string>("");
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");
  const [showUpload, setShowUpload] = useState(false);
  const [plant, setPlant] = useState<Plant | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get plant data from Suspense
  const cacheKey = `plant-details-${userId}-${plantId}`;
  const resource = getSuspenseResource(cacheKey, () => fetchPlantDetailsData(userId, plantId));
  const {
    plant: initialPlant,
    logs: initialLogs,
    environmentData,
    lastWatering,
    lastFeeding,
    lastTraining,
    lastFlowering,
    lastEnvironmentFromLogs
  } = resource.read();

  // Initialize local state from Suspense data
  if (!plant) {
    setPlant(initialPlant);
    setLogs(initialLogs);
    const plantData = initialPlant;
    const loadedPhotos: string[] = plantData.photos || [];
    const loadedCover: string = plantData.coverPhoto || "";
    setPhotos(loadedPhotos);
    setCoverPhoto(loadedCover);
    setSelectedPhoto(loadedCover || loadedPhotos[0] || "");
  }

  const handleBack = () => {
    router.push(ROUTE_PLANTS);
  };

  const recomputeLasts = (logsData: LogEntry[]) => {
    // This function can be called when logs are updated locally
    // For now, we'll use the initial data from Suspense
  };

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
      const envRef = collection(db, "users", userId, "plants", plantId, "environment");
      const envSnap = await getDocs(envRef);
      for (const d of envSnap.docs) {
        await deleteDoc(d.ref);
      }

      // Delete plant document
      await deleteDoc(plantDocRef(userId, plantId));

      router.push(resolveHomePathForRoles(roles));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error?.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "users", userId, "plants", plantId, "logs", logId));
      const updated = logs.filter((l) => l.id !== logId);
      setLogs(updated);
      toast({
        title: t("journal.deleted"),
        description: t("journal.deletedDesc"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    }
  };

  const handleRemovePhoto = async (index: number) => {
    if (!userId || !plant) return;

    // Get all available images
    const allImages = [
      ...(plant?.coverPhoto ? [plant.coverPhoto] : []),
      ...(photos || []),
    ].filter((img, i, arr) => arr.indexOf(img) === i);

    const photoToRemove = allImages[index];
    const isRemovingCover = photoToRemove === plant?.coverPhoto;

    try {
      let newPhotos = photos.filter((p) => p !== photoToRemove);
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
      setPhotos(newPhotos);
      setCoverPhoto(newCoverPhoto || "");

      if (selectedPhoto === photoToRemove) {
        setSelectedPhoto(newCoverPhoto || newPhotos[0] || "");
      }

      // Update plant state
      setPlant((prev) =>
        prev
          ? {
              ...prev,
              photos: newPhotos,
              coverPhoto: newCoverPhoto,
            }
          : null
      );

      toast({
        title: t("photos.removeSuccess", { ns: "plants" }),
        description: t("photos.photoRemoved", { ns: "plants" }),
      });

      // Refresh page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("photos.removeError", { ns: "plants" }),
        description: error.message,
      });
    }
  };

  const handleSetCoverPhoto = async (photoUrl: string) => {
    if (!userId) return;
    try {
      await updateDoc(plantDocRef(userId, plantId), {
        coverPhoto: photoUrl,
      });
      setCoverPhoto(photoUrl);
      setSelectedPhoto(photoUrl);
      setPlant((prev) => (prev ? { ...prev, coverPhoto: photoUrl } : null));
      toast({
        title: t("photos.coverPhotoSet", { ns: "plants" }),
        description: t("photos.coverPhotoSetDesc", { ns: "plants" }),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("photos.coverPhotoError", { ns: "plants" }),
        description: error.message,
      });
    }
  };

  const handlePhotosChange = async (newPhotos: string[]) => {
    if (!userId) return;
    try {
      const updated = [...photos, ...newPhotos];
      await updateDoc(plantDocRef(userId, plantId), { photos: updated });
      setPhotos(updated);
      if (!coverPhoto && updated.length > 0) setSelectedPhoto(updated[0]);
      toast({
        title: t("photos.uploadSuccess", { ns: "plants" }),
        description: t("photos.photosUpdated", { ns: "plants" }),
      });

      // Refresh page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("photos.uploadError", { ns: "plants" }),
        description: error.message,
      });
    } finally {
      setShowUpload(false);
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
          onAddPhoto={() => setShowUpload(true)}
          onRemovePhoto={handleRemovePhoto}
          onSetCoverPhoto={handleSetCoverPhoto}
          onUpdate={(patch) =>
            setPlant((prev) => (prev ? { ...prev, ...patch } : null))
          }
          language={i18n.language}
        />
      </div>

      {/* Desktop Plant Page */}
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
              <h1 className="text-3xl font-bold">{plant.name}</h1>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    plant.seedType === "autoflowering"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {plant.seedType === "autoflowering"
                    ? t("newPlant.autoflowering")
                    : t("newPlant.photoperiodic")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete plant"
                    className="shrink-0 hover:bg-transparent"
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("deleteTitle", { ns: "plants" })}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteDesc", { ns: "plants" })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      {t("cancel", { ns: "common" })}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeletePlant}
                      disabled={isDeleting}
                    >
                      {t("deleteConfirm", { ns: "plants" })}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Profile layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: main image + thumbnails */}
          <Card className="overflow-hidden">
            <div className="relative aspect-[4/3] bg-muted">
              <Image
                src={
                  selectedPhoto || coverPhoto || photos[0] || "/placeholder.svg"
                }
                alt={plant.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="flex items-center justify-between px-3 pb-2">
              <div className="text-sm text-muted-foreground">
                {photos.length}{" "}
                {photos.length === 1
                  ? t("photos.photo", { ns: "plants" })
                  : t("photos.photos", { ns: "plants" })}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowUpload(true)}
              >
                <Plus className="mr-2 h-4 w-4" />{" "}
                {t("photos.addPhotos", { ns: "plants" })}
              </Button>
            </div>
            {photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-6">
                {photos.map((p, idx) => (
                  <div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedPhoto(p)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedPhoto(p);
                      }
                    }}
                    className={`relative aspect-square overflow-hidden rounded-md border cursor-pointer ${
                      (selectedPhoto || coverPhoto) === p
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                  >
                    <Image
                      src={p}
                      alt={`${plant.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="100px"
                      loading="lazy"
                    />

                    {/* Controls: Set cover + Delete photo */}
                    {coverPhoto !== p && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-1 bottom-1 h-6 w-6 p-0 bg-white/80 hover:bg-white"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={t("photos.setAsCover", {
                              ns: "plants",
                            })}
                          >
                            <Star className="h-3.5 w-3.5 text-yellow-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("photos.setCoverConfirmTitle", {
                                ns: "plants",
                              })}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("photos.setCoverConfirmDesc", {
                                ns: "plants",
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t("settings.cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!userId) return;
                                try {
                                  await updateDoc(plantDocRef(userId, plantId), {
                                    coverPhoto: p,
                                  });
                                  setCoverPhoto(p);
                                  setSelectedPhoto(p);
                                  toast({
                                    title: t("photos.coverPhotoSet", {
                                      ns: "plants",
                                    }),
                                  });
                                } catch (error: any) {
                                  toast({
                                    variant: "destructive",
                                    title: t("common.error"),
                                    description: error.message,
                                  });
                                }
                              }}
                            >
                              {t("photos.setAsCover", { ns: "plants" })}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {/* Delete photo small button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 p-0 bg-white/80 hover:bg-white"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={t("photos.removeSuccess", {
                            ns: "plants",
                          })}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("settings.confirmDelete", { ns: "common" })}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("settings.confirmDeleteDesc", { ns: "common" })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t("cancel", { ns: "common" })}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleRemovePhoto(idx);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t("deleteConfirm", { ns: "sessions" })}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Right: plant details + environment */}
          <div className="space-y-6">
            <PlantDetails
              plant={plant}
              userId={userId}
              lastWatering={lastWatering || undefined}
              lastFeeding={lastFeeding || undefined}
              lastTraining={lastTraining || undefined}
              lastFlowering={lastFlowering || undefined}
              onUpdate={(patch) =>
                setPlant((prev) => (prev ? { ...prev, ...patch } : prev))
              }
            />
            <Card>
              <CardHeader>
                <CardTitle>{t("plantPage.environmentData")}</CardTitle>
                <CardDescription>
                  {t("plantPage.environmentDataDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnvironmentChart data={environmentData} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Journal section */}
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{t("plantPage.recentLogs")}</CardTitle>
              <CardDescription>{t("plantPage.recentLogsDesc")}</CardDescription>
            </div>
            <Button
              size="icon"
              aria-label="Add log"
              onClick={() =>
                router.push(`${ROUTE_JOURNAL}/new?plantId=${plantId}&returnTo=plant`)
              }
            >
              <Plus className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <JournalEntries
              logs={logs}
              onDelete={(log) => handleDeleteLog(log.id!)}
            />
          </CardContent>
        </Card>

        {/* Upload photos modal */}
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {t("photos.uploadPhotos", { ns: "plants" })}
              </DialogTitle>
            </DialogHeader>
            <ImageUpload
              onImagesChange={handlePhotosChange}
              maxImages={DEFAULT_MAX_IMAGES}
              maxSizeMB={DEFAULT_MAX_SIZE_MB}
              className="mt-4"
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

// Error boundary for plant not found
function PlantDetailsErrorBoundary({ userId, plantId }: PlantDetailsContainerProps) {
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

export function PlantDetailsContainer({ userId, plantId }: PlantDetailsContainerProps) {
  return (
    <Suspense fallback={<div className="p-4 md:p-6"><PlantDetailSkeleton /></div>}>
      <PlantDetailsContent userId={userId} plantId={plantId} />
    </Suspense>
  );
}