"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Layout } from "@/components/layout";
import { PlantCard } from "@/components/plant-card";
import { ReminderSystem } from "@/components/reminder-system";
import { Search } from "@/components/search";
import { Plus, Loader2 } from "lucide-react";
import type { Plant, LogEntry } from "@/types";

export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
  const [lastWaterings, setLastWaterings] = useState<Record<string, LogEntry>>(
    {}
  );
  const [lastFeedings, setLastFeedings] = useState<Record<string, LogEntry>>(
    {}
  );
  const [lastTrainings, setLastTrainings] = useState<Record<string, LogEntry>>(
    {}
  );
  const [userId, setUserId] = useState<string | null>(null);

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
    const fetchPlants = async () => {
      if (!userId) return;

      try {
        const plantsRef = collection(db, "users", userId, "plants");
        const q = query(plantsRef);
        const querySnapshot = await getDocs(q);

        const plantsData: Plant[] = [];
        const wateringsData: Record<string, LogEntry> = {};
        const feedingsData: Record<string, LogEntry> = {};
        const trainingsData: Record<string, LogEntry> = {};

        // Fetch plants and their last logs
        for (const doc of querySnapshot.docs) {
          const plantData = { id: doc.id, ...doc.data() } as Plant;
          plantsData.push(plantData);

          // Get last watering for this plant
          try {
            const logsRef = collection(
              db,
              "users",
              userId,
              "plants",
              doc.id,
              "logs"
            );

            // Debug: Check all logs for this plant
            const allLogsQuery = query(logsRef, orderBy("date", "desc"));
            const allLogsSnap = await getDocs(allLogsQuery);
            const allLogs = allLogsSnap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as LogEntry[];

            // Filter logs by type in the client
            const wateringLogs = allLogs.filter(
              (log) => log.type === "watering"
            );
            const feedingLogs = allLogs.filter((log) => log.type === "feeding");
            const trainingLogs = allLogs.filter(
              (log) => log.type === "training"
            );

            // Set the latest logs
            if (wateringLogs.length > 0) {
              wateringsData[doc.id] = wateringLogs[0];
            }
            if (feedingLogs.length > 0) {
              feedingsData[doc.id] = feedingLogs[0];
            }
            if (trainingLogs.length > 0) {
              trainingsData[doc.id] = trainingLogs[0];
            }
          } catch (error) {
            console.error(`Error fetching logs for plant ${doc.id}:`, error);
          }
        }

        setPlants(plantsData);
        setFilteredPlants(plantsData);
        setLastWaterings(wateringsData);
        setLastFeedings(feedingsData);
        setLastTrainings(trainingsData);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: t("dashboard.error"),
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchPlants();
    }
  }, [userId, toast, t]);

  const handleSearch = (query: string) => {
    const filtered = plants.filter((plant) =>
      plant.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPlants(filtered);
  };

  const handleClearSearch = () => {
    setFilteredPlants(plants);
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
        <Button onClick={() => router.push("/plants/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("dashboard.addPlant")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Reminders Section */}
          {plants.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {t("dashboard.reminders")}
              </h2>
              <ReminderSystem plants={plants} />
            </div>
          )}

          {/* Plants Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {t("dashboard.yourPlants")}
              </h2>
              {plants.length > 0 && (
                <Search
                  placeholder={t("search.placeholder")}
                  onSearch={handleSearch}
                  onClear={handleClearSearch}
                  className="w-64"
                />
              )}
            </div>
            {plants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlants.map((plant) => {
                  const watering = lastWaterings[plant.id];
                  const feeding = lastFeedings[plant.id];
                  const training = lastTrainings[plant.id];

                  return (
                    <PlantCard
                      key={plant.id}
                      plant={plant}
                      lastWatering={watering}
                      lastFeeding={feeding}
                      lastTraining={training}
                    />
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{t("dashboard.noPlants")}</CardTitle>
                  <CardDescription>
                    {t("dashboard.noPlantDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Button onClick={() => router.push("/plants/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("dashboard.addPlant")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
