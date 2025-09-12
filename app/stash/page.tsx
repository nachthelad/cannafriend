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
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTE_LOGIN, ROUTE_STASH, ROUTE_STASH_NEW, resolveHomePathForRoles } from "@/lib/routes";
import { useUserRoles } from "@/hooks/use-user-roles";
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
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
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
  const { t } = useTranslation(["stash", "common"]);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuthUser();
  const { roles } = useUserRoles();
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
          title: t("error", { ns: "common" }),
          description: e?.message || String(e),
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) void fetchItems();
  }, [userId]);

  const openNew = () => {
    // Always redirect to dedicated page for better UX and consistency
    router.push(ROUTE_STASH_NEW);
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
        title: t(editing?.id ? "updated" : "saved", { ns: "stash" }),
        description: t(editing?.id ? "updatedDesc" : "savedDesc", {
          ns: "stash",
        }),
      });
      setEditOpen(false);
      reset();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("error", { ns: "common" }),
        description: e?.message || String(e),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => router.replace(resolveHomePathForRoles(roles));

  const removeItem = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "users", userId, "stash", id));
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast({ title: t("delete", { ns: "stash" }) });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("error", { ns: "common" }),
        description: e?.message || String(e),
      });
    }
  };

  return (
    <Layout>
      {/* Mobile Header */}
      <div className="md:hidden mb-4 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{t("title", { ns: "stash" })}</h1>
            <p className="text-sm text-muted-foreground">
              {t("description", { ns: "stash" })}
            </p>
          </div>
          <Button
            size="icon"
            onClick={openNew}
            aria-label={t("addItem", { ns: "stash" })}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

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
            <h1 className="text-3xl font-bold">{t("title", { ns: "stash" })}</h1>
            <p className="text-muted-foreground">{t("description", { ns: "stash" })}</p>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> {t("addItem", { ns: "stash" })}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 md:p-6 space-y-4 overflow-x-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-2 w-full sm:w-auto">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-44 sm:w-72" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("empty", { ns: "stash" })}</CardTitle>
            <CardDescription>{t("emptyDesc", { ns: "stash" })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="hidden sm:block">
              <Button onClick={openNew}>
                <Plus className="mr-2 h-4 w-4" />{" "}
                {t("addItem", { ns: "stash" })}
              </Button>
            </div>
            <div className="sm:hidden">
              <Button
                onClick={openNew}
                aria-label={t("addItem", { ns: "stash" })}
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
                      ? t("types.flower", { ns: "stash" })
                      : it.type === "concentrate"
                      ? t("types.concentrate", { ns: "stash" })
                      : t("types.edible", { ns: "stash" })}{" "}
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
              {editing?.id
                ? t("update", { ns: "stash" })
                : t("addItem", { ns: "stash" })}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {t("requiredHint", { ns: "stash" })}
            </p>
            <div>
              <label className="text-sm font-medium">
                {t("name", { ns: "stash" })}
              </label>
              <Input
                {...register("name", {
                  required: t("nameRequired", { ns: "stash" }) as any,
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
                <label className="text-sm font-medium">
                  {t("type", { ns: "stash" })}
                </label>
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
                      {t("types.flower", { ns: "stash" })}
                    </SelectItem>
                    <SelectItem value="concentrate">
                      {t("types.concentrate", { ns: "stash" })}
                    </SelectItem>
                    <SelectItem value="edible">
                      {t("types.edible", { ns: "stash" })}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t("amount", { ns: "stash" })}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    {...register("amount", {
                      required: t("amountRequired", { ns: "stash" }) as any,
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
                      <SelectItem value="g">
                        {t("units.g", { ns: "stash" })}
                      </SelectItem>
                      <SelectItem value="ml">
                        {t("units.ml", { ns: "stash" })}
                      </SelectItem>
                      <SelectItem value="units">
                        {t("units.units", { ns: "stash" })}
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
                <label className="text-sm font-medium">
                  {t("thc", { ns: "stash" })}
                </label>
                <Input {...register("thc")} />
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t("cbd", { ns: "stash" })}
                </label>
                <Input {...register("cbd")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">
                  {t("vendor", { ns: "stash" })}
                </label>
                <Input {...register("vendor")} />
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t("price", { ns: "stash" })}
                </label>
                <Input {...register("price")} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">
                {t("notes", { ns: "stash" })}
              </label>
              <Textarea {...register("notes")} />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                {t("cancel", { ns: "common" })}
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
                    {t("loading", { ns: "common" })}
                  </span>
                ) : (
                  t(editing?.id ? "update" : "save", { ns: "stash" })
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
