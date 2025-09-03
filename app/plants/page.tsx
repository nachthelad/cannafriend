"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN, ROUTE_PLANTS_NEW } from "@/lib/routes";
import { plantsCol, logsCol } from "@/lib/paths";
import {
  query,
  getDocs,
  orderBy,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { Plus } from "lucide-react";
import { AnimatedLogo } from "@/components/common/animated-logo";
import type { Plant, LogEntry } from "@/types";
import { PlantCard } from "@/components/plant/plant-card";
import { MobilePlantList } from "@/components/mobile/mobile-plant-list";
import { MobilePlantListSkeleton } from "@/components/skeletons/mobile-plant-list-skeleton";

export default function PlantsListPage() {
  const { t } = useTranslation(["plants", "common", "dashboard"]);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;
  const [isLoading, setIsLoading] = useState(true);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [lastWaterings, setLastWaterings] = useState<Record<string, LogEntry>>(
    {}
  );
  const [lastFeedings, setLastFeedings] = useState<Record<string, LogEntry>>(
    {}
  );
  const [lastTrainings, setLastTrainings] = useState<Record<string, LogEntry>>(
    {}
  );
  const [search, setSearch] = useState("");
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 12;

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchPlants = async () => {
      if (!userId) return;
      try {
        const q = query(
          plantsCol(userId),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE)
        );
        const snap = await getDocs(q);
        const list: Plant[] = [];
        for (const d of snap.docs) {
          const p = { id: d.id, ...d.data() } as Plant;
          list.push(p);
        }

        // fetch last logs for all plants in parallel
        await Promise.all(
          snap.docs.map(async (d) => {
            try {
              const lq = query(logsCol(userId, d.id), orderBy("date", "desc"));
              const ls = await getDocs(lq);
              const all = ls.docs.map((x) => ({
                id: x.id,
                ...x.data(),
              })) as LogEntry[];
              const w = all.find((l) => l.type === "watering");
              const f = all.find((l) => l.type === "feeding");
              const tr = all.find((l) => l.type === "training");
              if (w) setLastWaterings((prev) => ({ ...prev, [d.id]: w }));
              if (f) setLastFeedings((prev) => ({ ...prev, [d.id]: f }));
              if (tr) setLastTrainings((prev) => ({ ...prev, [d.id]: tr }));
            } catch {
              // ignore per-plant logs errors
            }
          })
        );

        setPlants(list);
        setLastDoc(
          snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null
        );
        setHasMore(snap.docs.length === PAGE_SIZE);
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) void fetchPlants();
  }, [userId]);

  const loadMore = async () => {
    if (!userId || !lastDoc) return;
    setIsLoadingMore(true);
    try {
      const q = query(
        plantsCol(userId),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(q);
      const newPlants: Plant[] = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Plant)
      );
      setPlants((prev) => [...prev, ...newPlants]);

      await Promise.all(
        snap.docs.map(async (d) => {
          try {
            const lq = query(logsCol(userId, d.id), orderBy("date", "desc"));
            const ls = await getDocs(lq);
            const all = ls.docs.map((x) => ({
              id: x.id,
              ...x.data(),
            })) as LogEntry[];
            const w = all.find((l) => l.type === "watering");
            const f = all.find((l) => l.type === "feeding");
            const tr = all.find((l) => l.type === "training");
            if (w) setLastWaterings((prev) => ({ ...prev, [d.id]: w }));
            if (f) setLastFeedings((prev) => ({ ...prev, [d.id]: f }));
            if (tr) setLastTrainings((prev) => ({ ...prev, [d.id]: tr }));
          } catch {
            // ignore per-plant logs errors
          }
        })
      );

      setLastDoc(
        snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : lastDoc
      );
      setHasMore(snap.docs.length === PAGE_SIZE);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return plants;
    const q = search.toLowerCase();
    return plants.filter((p) => p.name.toLowerCase().includes(q));
  }, [plants, search]);

  return (
    <Layout>
      {/* Mobile Plant List - only show on mobile */}
      <div className="md:hidden">
        {isLoading ? (
          <MobilePlantListSkeleton />
        ) : (
          <MobilePlantList
            plants={plants}
            isLoading={isLoading}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
            language={t("language", { ns: "common" }) || "en"}
          />
        )}
      </div>

      {/* Desktop Plant List - only show on desktop */}
      <div className="hidden md:block">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <AnimatedLogo size={32} className="text-primary" duration={1.5} />
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold">
                  {t("yourPlants", { ns: "dashboard" })}
                </h1>
                <p className="text-muted-foreground">
                  {t("managementDesc", { ns: "plants" })}
                </p>
              </div>
              <Button onClick={() => router.push(ROUTE_PLANTS_NEW)}>
                <Plus className="h-4 w-4 mr-2" /> {t("addPlant", { ns: "dashboard" })}
              </Button>
            </div>

            <div className="mb-4">
              <Input
                placeholder={t("searchPlaceholder", { ns: "plants" })}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    lastWatering={lastWaterings[plant.id]}
                    lastFeeding={lastFeedings[plant.id]}
                    lastTraining={lastTrainings[plant.id]}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{t("noPlants", { ns: "dashboard" })}</CardTitle>
                  <CardDescription>
                    {t("noPlantDesc", { ns: "dashboard" })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => router.push(ROUTE_PLANTS_NEW)}>
                    <Plus className="h-4 w-4 mr-2" /> {t("addPlant", { ns: "dashboard" })}
                  </Button>
                </CardContent>
              </Card>
            )}

            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <AnimatedLogo
                        size={16}
                        className="mr-2 text-primary"
                        duration={1.2}
                      />{" "}
                      {t("loading", { ns: "common" })}
                    </>
                  ) : (
                    t("loadMore", { ns: "common" })
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
