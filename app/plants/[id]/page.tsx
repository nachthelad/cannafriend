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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  where,
  limit,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Layout } from "@/components/layout";
import { PlantDetails } from "@/components/plant/plant-details";
import { JournalEntries } from "@/components/journal/journal-entries";
import { EnvironmentChart } from "@/components/plant/environment-chart";
import { PhotoGallery } from "@/components/plant/photos/photo-gallery";
import { AddLogForm } from "@/components/journal/add-log-form";
import {
  Loader2,
  CalendarIcon,
  LineChart,
  ImageIcon,
  Trash2,
} from "lucide-react";
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
  const [lastWatering, setLastWatering] = useState<LogEntry | null>(null);
  const [lastFeeding, setLastFeeding] = useState<LogEntry | null>(null);
  const [lastTraining, setLastTraining] = useState<LogEntry | null>(null);
  const [lastFlowering, setLastFlowering] = useState<LogEntry | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

        // Filter logs by type in the client (same logic as dashboard)
        const wateringLogs = logsData.filter((log) => log.type === "watering");
        const feedingLogs = logsData.filter((log) => log.type === "feeding");
        const trainingLogs = logsData.filter((log) => log.type === "training");
        const floweringLogs = logsData.filter(
          (log) => log.type === "flowering"
        );

        // Set the latest logs
        if (wateringLogs.length > 0) {
          setLastWatering(wateringLogs[0]);
        }
        if (feedingLogs.length > 0) {
          setLastFeeding(feedingLogs[0]);
        }
        if (trainingLogs.length > 0) {
          setLastTraining(trainingLogs[0]);
        }
        if (floweringLogs.length > 0) {
          setLastFlowering(floweringLogs[0]);
        }

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
        setPhotos(plantData.photos || []);
        setCoverPhoto(plantData.coverPhoto || "");
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

  return (
    <Layout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{plant.name}</h1>
          <p className="text-muted-foreground">
            {t(`newPlant.${plant.seedType}`)}
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              aria-label="Delete plant"
              className="shrink-0"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("settings.confirmDelete")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("settings.confirmDeleteDesc")}
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
                {t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="details">
            <ImageIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t("plantPage.details")}</span>
          </TabsTrigger>
          <TabsTrigger value="journal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t("plantPage.journal")}</span>
          </TabsTrigger>
          <TabsTrigger value="environment">
            <LineChart className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">
              {t("plantPage.environment")}
            </span>
          </TabsTrigger>
          <TabsTrigger value="photos">
            <ImageIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t("plantPage.photos")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <PlantDetails
            plant={plant}
            lastWatering={lastWatering || undefined}
            lastFeeding={lastFeeding || undefined}
            lastTraining={lastTraining || undefined}
            lastFlowering={lastFlowering || undefined}
          />
        </TabsContent>

        <TabsContent value="journal">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("plantPage.addLog")}</CardTitle>
                <CardDescription>{t("plantPage.addLogDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <AddLogForm
                  plantId={id}
                  onSuccess={(newLog) => setLogs([newLog, ...logs])}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("plantPage.recentLogs")}</CardTitle>
                <CardDescription>
                  {t("plantPage.recentLogsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JournalEntries logs={logs} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="environment">
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
        </TabsContent>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>{t("plantPage.photoGallery")}</CardTitle>
              <CardDescription>
                {t("plantPage.photoGalleryDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoGallery
                photos={photos}
                plantId={id}
                onPhotosUpdate={setPhotos}
                coverPhoto={coverPhoto}
                onCoverPhotoUpdate={setCoverPhoto}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
