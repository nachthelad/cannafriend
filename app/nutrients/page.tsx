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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/use-translation";
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
import { Loader2, Plus, X } from "lucide-react";

interface NutrientMix {
  id: string;
  name: string;
  npk?: string;
  notes?: string;
  createdAt: string;
}

export default function NutrientsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [mixes, setMixes] = useState<NutrientMix[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NutrientMix | null>(null);
  const [name, setName] = useState("");
  const [npk, setNpk] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

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

  const resetForm = () => {
    setEditing(null);
    setName("");
    setNpk("");
    setNotes("");
  };

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) resetForm();
  };

  const handleSave = async () => {
    if (!userId || !name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        npk: npk.trim() || undefined,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      if (editing) {
        await updateDoc(doc(db, buildNutrientMixPath(userId, editing.id)), {
          ...payload,
        });
      } else {
        await addDoc(collection(db, buildNutrientMixesPath(userId)), payload);
      }
      setOpen(false);
      resetForm();
      await fetchMixes();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (mix: NutrientMix) => {
    setEditing(mix);
    setName(mix.name || "");
    setNpk(mix.npk || "");
    setNotes(mix.notes || "");
    setOpen(true);
  };

  const handleDelete = async (mix: NutrientMix) => {
    if (!userId) return;
    await deleteDoc(doc(db, buildNutrientMixPath(userId, mix.id)));
    await fetchMixes();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("nutrients.title")}</h1>
          <p className="text-muted-foreground">{t("nutrients.description")}</p>
        </div>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Agregar mezcla
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar mezcla" : "Nueva mezcla"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mix-name">Nombre</Label>
                <Input
                  id="mix-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mix-npk">NPK</Label>
                <Input
                  id="mix-npk"
                  placeholder="ej. 3-1-2"
                  value={npk}
                  onChange={(e) => setNpk(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mix-notes">Notas</Label>
                <Textarea
                  id="mix-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4 mr-1" /> {t("common.cancel")}
                </Button>
                <Button onClick={handleSave} disabled={!name.trim() || saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {editing ? t("common.save") : t("common.add")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <Input
          placeholder={t("search.placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("nutrients.empty")}</CardTitle>
            <CardDescription>{t("nutrients.emptyDesc")}</CardDescription>
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
                      onClick={() => handleEdit(mix)}
                    >
                      {t("common.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(mix)}
                    >
                      {t("common.delete")}
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
