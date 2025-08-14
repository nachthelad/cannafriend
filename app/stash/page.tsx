"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN } from "@/lib/routes";
import { db } from "@/lib/firebase";
import {
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
} from "firebase/firestore";
import { stashCol } from "@/lib/paths";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";

type StashItem = {
  id: string;
  name: string;
  type: "flower" | "concentrate" | "edible";
  amount?: string;
  unit?: string; // g, ml, units
  thc?: string;
  cbd?: string;
  addedAt?: string; // ISO
  vendor?: string;
  price?: string;
  notes?: string;
};

export default function StashPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<StashItem[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<StashItem | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchItems = async () => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const ref = stashCol(userId);
        const q = query(ref);
        const snap = await getDocs(q);
        const list: StashItem[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        // no specific ordering yet
        setItems(list);
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: e?.message || String(e),
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) void fetchItems();
  }, [userId]);

  const openNew = () => {
    setEditing({
      id: "",
      name: "",
      type: "flower",
      amount: "",
      unit: "g",
      thc: "",
      cbd: "",
      addedAt: new Date().toISOString(),
      vendor: "",
      price: "",
      notes: "",
    });
    setEditOpen(true);
  };

  const openEdit = (item: StashItem) => {
    setEditing({ ...item });
    setEditOpen(true);
  };

  const [saving, setSaving] = useState(false);

  type StashForm = {
    name: string;
    type: "flower" | "concentrate" | "edible";
    amount: string;
    unit: string;
    thc?: string;
    cbd?: string;
    vendor?: string;
    price?: string;
    notes?: string;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<StashForm>({
    defaultValues: {
      name: "",
      type: "flower",
      amount: "",
      unit: "g",
      thc: "",
      cbd: "",
      vendor: "",
      price: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (editOpen) {
      reset({
        name: editing?.name || "",
        type: (editing?.type as any) || "flower",
        amount: editing?.amount || "",
        unit: editing?.unit || "g",
        thc: editing?.thc || "",
        cbd: editing?.cbd || "",
        vendor: editing?.vendor || "",
        price: editing?.price || "",
        notes: editing?.notes || "",
      });
    }
  }, [editOpen, editing, reset]);

  const typeValue = watch("type");
  const unitValue = watch("unit");

  const onSubmit = async (data: StashForm) => {
    if (!userId) return;
    try {
      setSaving(true);
      const ref = stashCol(userId);
      const payload = {
        name: data.name,
        type: data.type,
        amount: data.amount || "",
        unit: data.unit || "g",
        thc: data.thc || "",
        cbd: data.cbd || "",
        addedAt: editing?.addedAt || new Date().toISOString(),
        vendor: data.vendor || "",
        price: data.price || "",
        notes: data.notes || "",
      };
      if (!editing?.id) {
        const docRef = await addDoc(ref, payload);
        setItems((prev) => [
          { id: docRef.id, ...payload } as StashItem,
          ...prev,
        ]);
      } else {
        await updateDoc(doc(db, "users", userId, "stash", editing.id), payload);
        setItems((prev) =>
          prev.map((it) =>
            it.id === editing.id
              ? ({ id: editing.id, ...payload } as StashItem)
              : it
          )
        );
      }
      toast({
        title: t(
          editing?.id ? ("stash.updated" as any) : ("stash.saved" as any)
        ),
        description: t(
          editing?.id
            ? ("stash.updatedDesc" as any)
            : ("stash.savedDesc" as any)
        ),
      });
      setEditOpen(false);
      reset();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: e?.message || String(e),
      });
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "users", userId, "stash", id));
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast({ title: t("stash.delete" as any) });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: e?.message || String(e),
      });
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold">{t("stash.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("stash.description")}</p>
        </div>
        <div className="shrink-0">
          <div className="hidden sm:block">
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" /> {t("stash.addItem")}
            </Button>
          </div>
          <div className="sm:hidden">
            <Button
              onClick={openNew}
              aria-label={t("stash.addItem")}
              className="h-9 w-9 p-0"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">Cargando...</div>
      ) : items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("stash.empty")}</CardTitle>
            <CardDescription>{t("stash.emptyDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="hidden sm:block">
              <Button onClick={openNew}>
                <Plus className="mr-2 h-4 w-4" /> {t("stash.addItem")}
              </Button>
            </div>
            <div className="sm:hidden">
              <Button
                onClick={openNew}
                aria-label={t("stash.addItem")}
                className="h-9 w-9 p-0"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <Card key={it.id}>
              <CardHeader className="flex items-start justify-between space-y-0 gap-2">
                <div className="min-w-0 pr-2">
                  <CardTitle className="truncate">{it.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {it.type === "flower"
                      ? t("stash.types.flower")
                      : it.type === "concentrate"
                      ? t("stash.types.concentrate")
                      : t("stash.types.edible")}{" "}
                    • {it.amount} {it.unit}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(it)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeItem(it.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {it.notes && <p className="text-sm">{it.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? t("stash.update") : t("stash.addItem")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {t("stash.requiredHint")}
            </p>
            <div>
              <label className="text-sm font-medium">{t("stash.name")}</label>
              <Input
                {...register("name", {
                  required: t("stash.nameRequired") as any,
                })}
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">
                  {String(errors.name.message)}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">{t("stash.type")}</label>
                <input
                  type="hidden"
                  {...register("type")}
                  value={typeValue}
                  readOnly
                />
                <Select
                  value={typeValue}
                  onValueChange={(v) =>
                    setValue("type", v as any, { shouldDirty: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flower">
                      {t("stash.types.flower")}
                    </SelectItem>
                    <SelectItem value="concentrate">
                      {t("stash.types.concentrate")}
                    </SelectItem>
                    <SelectItem value="edible">
                      {t("stash.types.edible")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t("stash.amount")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    {...register("amount", {
                      required: t("stash.amountRequired") as any,
                    })}
                    placeholder="0.0"
                  />
                  <input
                    type="hidden"
                    {...register("unit")}
                    value={unitValue}
                    readOnly
                  />
                  <Select
                    value={unitValue}
                    onValueChange={(v) =>
                      setValue("unit", v, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">{t("stash.units.g")}</SelectItem>
                      <SelectItem value="ml">{t("stash.units.ml")}</SelectItem>
                      <SelectItem value="units">
                        {t("stash.units.units")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.amount && (
                  <p className="text-xs text-destructive mt-1">
                    {String(errors.amount.message)}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">{t("stash.thc")}</label>
                <Input {...register("thc")} />
              </div>
              <div>
                <label className="text-sm font-medium">{t("stash.cbd")}</label>
                <Input {...register("cbd")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">
                  {t("stash.vendor")}
                </label>
                <Input {...register("vendor")} />
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t("stash.price")}
                </label>
                <Input {...register("price")} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t("stash.notes")}</label>
              <Textarea {...register("notes")} />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    {t("common.loading")}
                  </span>
                ) : (
                  t(
                    editing?.id
                      ? ("stash.update" as any)
                      : ("stash.save" as any)
                  )
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
