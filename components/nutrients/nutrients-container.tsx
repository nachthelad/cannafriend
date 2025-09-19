"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useTranslation } from "react-i18next";
import { useUserRoles } from "@/hooks/use-user-roles";
import { ROUTE_NUTRIENTS_NEW, resolveHomePathForRoles } from "@/lib/routes";
import { db } from "@/lib/firebase";
import {
  buildNutrientMixesPath,
  buildNutrientMixPath,
} from "@/lib/firebase-config";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { Plus, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getSuspenseResource } from "@/lib/suspense-utils";

interface NutrientsContainerProps {
  userId: string;
}

interface NutrientMix {
  id: string;
  name: string;
  npk?: string;
  notes?: string;
  createdAt: string;
}

interface NutrientsData {
  mixes: NutrientMix[];
}

async function fetchNutrientsData(userId: string): Promise<NutrientsData> {
  const q = query(
    collection(db, buildNutrientMixesPath(userId)),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  const mixes: NutrientMix[] = [];
  snap.forEach((d) => mixes.push({ id: d.id, ...(d.data() as any) }));

  return { mixes };
}

function NutrientsContent({ userId }: NutrientsContainerProps) {
  const { t } = useTranslation(["nutrients", "common"]);
  const router = useRouter();
  const { roles } = useUserRoles();
  const homePath = resolveHomePathForRoles(roles);
  const [search, setSearch] = useState("");
  const cacheKey = `nutrients-${userId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchNutrientsData(userId)
  );
  const { mixes: initialMixes } = resource.read();

  const [mixes, setMixes] = useState<NutrientMix[]>(initialMixes);
  const previousMixesRef = useRef<NutrientMix[] | null>(null);

  useEffect(() => {
    if (previousMixesRef.current === initialMixes) {
      return;
    }
    previousMixesRef.current = initialMixes;
    setMixes(initialMixes);
  }, [initialMixes]);

  const filtered = useMemo(() => {
    const currentMixes = mixes.length > 0 ? mixes : initialMixes;
    if (!search.trim()) return currentMixes;
    const q = search.toLowerCase();
    return currentMixes.filter((m) => m.name.toLowerCase().includes(q));
  }, [mixes, initialMixes, search]);

  const fetchMixes = async () => {
    if (!userId) return;
    try {
      const q = query(
        collection(db, buildNutrientMixesPath(userId)),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const list: NutrientMix[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setMixes(list);
    } catch (error) {
      console.error("Error fetching mixes:", error);
    }
  };

  const handleDelete = async (mix: NutrientMix) => {
    if (!userId) return;
    await deleteDoc(doc(db, buildNutrientMixPath(userId, mix.id)));
    await fetchMixes();
  };

  const handleAddMix = () => {
    router.push(ROUTE_NUTRIENTS_NEW);
  };

  return (
    <>
      <ResponsivePageHeader
        className="mb-6"
        title={t("title")}
        description={t("description")}
        onBackClick={() => router.replace(homePath)}
        desktopActions={
          <div className="flex items-center gap-3">
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button onClick={handleAddMix}>
              <Plus className="h-4 w-4 mr-2" />
              {t("addMix")}
            </Button>
          </div>
        }
        mobileActions={
          <Button size="icon" onClick={handleAddMix}>
            <Plus className="h-5 w-5" />
          </Button>
        }
        mobileControls={
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        }
        sticky={false}
      />

      {/* Content */}
      <div className="px-4 md:px-6">
        {filtered.length === 0 ? (
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
                  d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m3 0H4a1 1 0 00-1 1v16a1 1 0 001 1h16a1 1 0 001-1V5a1 1 0 00-1-1zM8 8h8m-8 4h8m-8 4h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {search ? t("noResults") : t("noMixes")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {search ? t("noResultsDesc") : t("noMixesDesc")}
            </p>
            {!search && (
              <Button onClick={() => router.push(ROUTE_NUTRIENTS_NEW)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("addFirstMix")}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((mix) => (
              <Card key={mix.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight pr-8">
                      {mix.name}
                    </CardTitle>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("deleteConfirm", { ns: "common" })}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("deleteDesc")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t("cancel", { ns: "common" })}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(mix)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t("delete", { ns: "common" })}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  {mix.npk && (
                    <CardDescription className="font-mono text-sm">
                      NPK: {mix.npk}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {mix.notes && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {mix.notes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("created", { ns: "common" })}:{" "}
                    {new Date(mix.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function NutrientsSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-10 w-80" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

export function NutrientsContainer({ userId }: NutrientsContainerProps) {
  return (
    <Suspense fallback={<NutrientsSkeleton />}>
      <NutrientsContent userId={userId} />
    </Suspense>
  );
}
