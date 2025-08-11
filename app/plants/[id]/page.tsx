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
import { auth, db } from "@/lib/firebase";
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
import { Loader2, Trash2, Plus } from "lucide-react";
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
import { addDoc } from "firebase/firestore";

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
  const [lastWatering, setLastWatering] = useState<LogEntry | null>(null);
  const [lastFeeding, setLastFeeding] = useState<LogEntry | null>(null);
  const [lastTraining, setLastTraining] = useState<LogEntry | null>(null);
  const [lastFlowering, setLastFlowering] = useState<LogEntry | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchPlantData = async () => {
      if (!userId) return;

      try {
        // Fetch plant details
        const plantRef = doc(db, "users", userId, "plants", id);
        const plantSnap = await getDoc(plantRef);

        if (!plantSnap.exists()) {
          toast({
            variant: "destructive",
            title: t("plantPage.notFound"),
            description: t("plantPage.notFoundDesc"),
          });
          router.push("/dashboard");
          return;
        }

        setPlant({ id: plantSnap.id, ...plantSnap.data() } as Plant);

        // Fetch logs
        const logsRef = collection(db, "users", userId, "plants", id, "logs");
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
      const logsRef = collection(db, "users", userId, "plants", id, "logs");
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
      await deleteDoc(doc(db, "users", userId, "plants", id));

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
          {photos.length > 1 && (
            <div className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-6">
              {photos.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPhoto(p)}
                  className={`relative aspect-square overflow-hidden rounded-md border ${
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
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Right: plant details + environment */}
        <div className="space-y-6">
          <PlantDetails
            plant={plant}
            lastWatering={lastWatering || undefined}
            lastFeeding={lastFeeding || undefined}
            lastTraining={lastTraining || undefined}
            lastFlowering={lastFlowering || undefined}
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
    </Layout>
  );
}
