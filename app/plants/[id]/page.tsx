"use client";

import type React from "react";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { db } from "@/lib/firebase";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN, ROUTE_DASHBOARD } from "@/lib/routes";
import { plantDoc as plantDocRef, logsCol } from "@/lib/paths";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Layout } from "@/components/layout";
import { PlantDetails } from "@/components/plant/plant-details";
import { JournalEntries } from "@/components/journal/journal-entries";
import { AddLogForm } from "@/components/journal/add-log-form";
import { ImageUpload } from "@/components/common/image-upload";
import { DEFAULT_MAX_IMAGES, DEFAULT_MAX_SIZE_MB } from "@/lib/image-config";
import { Loader2, Trash2, Plus, Star } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Plant, LogEntry, EnvironmentData } from "@/types";
import { addDoc, updateDoc } from "firebase/firestore";

export default function PlantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [plant, setPlant] = useState<Plant | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [environmentData, setEnvironmentData] = useState<EnvironmentData[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [coverPhoto, setCoverPhoto] = useState<string>("");
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");
  const [showUpload, setShowUpload] = useState(false);
  const [lastWatering, setLastWatering] = useState<LogEntry | null>(null);
  const [lastFeeding, setLastFeeding] = useState<LogEntry | null>(null);
  const [lastTraining, setLastTraining] = useState<LogEntry | null>(null);
  const [lastFlowering, setLastFlowering] = useState<LogEntry | null>(null);
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;
  const [isDeleting, setIsDeleting] = useState(false);
  const recomputeLasts = (logsData: LogEntry[]) => {
    const wateringLogs = logsData.filter((log) => log.type === "watering");
    const feedingLogs = logsData.filter((log) => log.type === "feeding");
    const trainingLogs = logsData.filter((log) => log.type === "training");
    const floweringLogs = logsData.filter((log) => log.type === "flowering");
    setLastWatering(wateringLogs[0] || null);
    setLastFeeding(feedingLogs[0] || null);
    setLastTraining(trainingLogs[0] || null);
    setLastFlowering(floweringLogs[0] || null);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchPlantData = async () => {
      if (!userId) return;

      try {
        // Fetch plant details
        const plantRef = plantDocRef(userId, id);
        const plantSnap = await getDoc(plantRef);

        if (!plantSnap.exists()) {
          toast({
            variant: "destructive",
            title: t("plantPage.notFound"),
            description: t("plantPage.notFoundDesc"),
          });
          router.push(ROUTE_DASHBOARD);
          return;
        }

        setPlant({ id: plantSnap.id, ...plantSnap.data() } as Plant);

        // Fetch logs
        const logsRef = logsCol(userId, id);
        const logsQuery = query(logsRef, orderBy("date", "desc"));
        const logsSnap = await getDocs(logsQuery);

        const logsData: LogEntry[] = [];
        logsSnap.forEach((doc) => {
          logsData.push({ id: doc.id, ...doc.data() } as LogEntry);
        });
        setLogs(logsData);

        recomputeLasts(logsData);

        // Fetch environment data
        const envRef = collection(
          db,
          "users",
          userId,
          "plants",
          id,
          "environment"
        );
        const envQuery = query(envRef, orderBy("date", "asc"));
        const envSnap = await getDocs(envQuery);

        const envData: EnvironmentData[] = [];
        envSnap.forEach((doc) => {
          envData.push({ id: doc.id, ...doc.data() } as EnvironmentData);
        });
        setEnvironmentData(envData);

        // Fetch photos from plant document
        const plantData = plantSnap.data();
        const loadedPhotos: string[] = plantData.photos || [];
        const loadedCover: string = plantData.coverPhoto || "";
        setPhotos(loadedPhotos);
        setCoverPhoto(loadedCover);
        setSelectedPhoto(loadedCover || loadedPhotos[0] || "");
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: t("plantPage.error"),
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchPlantData();
    }
  }, [userId, id, toast, t, router]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!plant) {
    return (
      <Layout>
        <Card>
          <CardHeader>
            <CardTitle>{t("plantPage.notFound")}</CardTitle>
            <CardDescription>{t("plantPage.notFoundDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")}>
              {t("plantPage.backToDashboard")}
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const handleDeletePlant = async () => {
    if (!userId) return;
    setIsDeleting(true);

    try {
      // Delete subcollection docs: logs
      const logsRef = logsCol(userId, id);
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
        id,
        "environment"
      );
      const envSnap = await getDocs(envRef);
      for (const d of envSnap.docs) {
        await deleteDoc(d.ref);
      }

      // Delete plant document
      await deleteDoc(plantDocRef(userId, id));

      router.push("/dashboard");
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
      await deleteDoc(doc(db, "users", userId, "plants", id, "logs", logId));
      const updated = logs.filter((l) => l.id !== logId);
      setLogs(updated);
      recomputeLasts(updated);
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
    if (!userId) return;
    const newPhotos = photos.filter((_, i) => i !== index);
    try {
      await updateDoc(plantDocRef(userId, id), { photos: newPhotos });
      setPhotos(newPhotos);
      if (selectedPhoto === photos[index]) {
        setSelectedPhoto(newPhotos[0] || coverPhoto || "");
      }
      toast({
        title: t("photos.removeSuccess"),
        description: t("photos.photoRemoved"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("photos.removeError"),
        description: error.message,
      });
    }
  };

  const handlePhotosChange = async (newPhotos: string[]) => {
    if (!userId) return;
    try {
      const updated = [...photos, ...newPhotos];
      await updateDoc(plantDocRef(userId, id), { photos: updated });
      setPhotos(updated);
      if (!coverPhoto && updated.length > 0) setSelectedPhoto(updated[0]);
      toast({
        title: t("photos.uploadSuccess"),
        description: t("photos.photosUpdated"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("photos.uploadError"),
        description: error.message,
      });
    } finally {
      setShowUpload(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start justify-between w-full">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{plant.name}</h1>
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
                      {t("plant.deleteTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("plant.deleteDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      {t("common.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeletePlant}
                      disabled={isDeleting}
                    >
                      {t("plant.deleteConfirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
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
              {photos.length === 1 ? t("photos.photo") : t("photos.photos")}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUpload(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> {t("photos.addPhotos")}
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
                          aria-label={t("photos.setAsCover")}
                        >
                          <Star className="h-3.5 w-3.5 text-yellow-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("photos.setCoverConfirmTitle")}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("photos.setCoverConfirmDesc")}
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
                                await updateDoc(plantDocRef(userId, id), {
                                  coverPhoto: p,
                                });
                                setCoverPhoto(p);
                                setSelectedPhoto(p);
                                toast({ title: t("photos.coverSet") });
                              } catch (error: any) {
                                toast({
                                  variant: "destructive",
                                  title: t("common.error"),
                                  description: error.message,
                                });
                              }
                            }}
                          >
                            {t("photos.setAsCover")}
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
                        aria-label={t("photos.removeSuccess")}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("settings.confirmDelete")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("settings.confirmDeleteDesc")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t("settings.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleRemovePhoto(idx);
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t("strains.deleteConfirm")}
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
            userId={userId!}
            lastWatering={lastWatering || undefined}
            lastFeeding={lastFeeding || undefined}
            lastTraining={lastTraining || undefined}
            lastFlowering={lastFlowering || undefined}
            onUpdate={(patch) =>
              setPlant((prev) => (prev ? { ...prev, ...patch } : prev))
            }
          />
        </div>
      </div>

      {/* Journal section */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{t("plantPage.recentLogs")}</CardTitle>
            <CardDescription>{t("plantPage.recentLogsDesc")}</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" aria-label="Add log">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{t("plantPage.addLog")}</DialogTitle>
              </DialogHeader>
              <AddLogForm
                plantId={id}
                onSuccess={(newLog) => setLogs([newLog, ...logs])}
              />
            </DialogContent>
          </Dialog>
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
            <DialogTitle>{t("photos.uploadPhotos")}</DialogTitle>
          </DialogHeader>
          <ImageUpload
            onImagesChange={handlePhotosChange}
            maxImages={DEFAULT_MAX_IMAGES}
            maxSizeMB={DEFAULT_MAX_SIZE_MB}
            className="mt-4"
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
