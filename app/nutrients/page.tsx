"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN } from "@/lib/routes";
import { db } from "@/lib/firebase";
import {
  buildNutrientMixesPath,
  buildNutrientMixPath,
} from "@/lib/firebase-config";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { Plus, X } from "lucide-react";
import { AnimatedLogo } from "@/components/common/animated-logo";
import { Skeleton } from "@/components/ui/skeleton";

interface NutrientMix {
  id: string;
  name: string;
  npk?: string;
  notes?: string;
  createdAt: string;
}

export default function NutrientsPage() {
  const { t } = useTranslation(["nutrients", "common"]);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [mixes, setMixes] = useState<NutrientMix[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) void fetchMixes();
  }, [userId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return mixes;
    const q = search.toLowerCase();
    return mixes.filter((m) => m.name.toLowerCase().includes(q));
  }, [mixes, search]);


  const handleDelete = async (mix: NutrientMix) => {
    if (!userId) return;
    await deleteDoc(doc(db, buildNutrientMixPath(userId, mix.id)));
    await fetchMixes();
  };

  if (isLoading) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={() => router.push("/nutrients/new")}>
          <Plus className="h-4 w-4 mr-2" /> {t("addMix")}
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder={t("search", { ns: "common" })}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("empty")}</CardTitle>
            <CardDescription>{t("emptyDesc")}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((mix) => (
            <Card key={mix.id} className="group">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{mix.name}</span>
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/nutrients/${mix.id}/edit`)}
                    >
                      {t("edit", { ns: "common" })}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(mix)}
                    >
                      {t("delete", { ns: "common" })}
                    </Button>
                  </div>
                </CardTitle>
                {mix.npk ? (
                  <CardDescription>NPK: {mix.npk}</CardDescription>
                ) : null}
              </CardHeader>
              {mix.notes ? (
                <CardContent className="text-sm text-muted-foreground">
                  {mix.notes}
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
