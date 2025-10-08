"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTE_STASH_NEW, resolveHomePathForRoles } from "@/lib/routes";
import { useUserRoles } from "@/hooks/use-user-roles";
import { db } from "@/lib/firebase";
import {
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  deleteField,
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
import { getSuspenseResource } from "@/lib/suspense-utils";
import type {
  StashContainerProps,
  StashData,
  StashFormValues,
  StashItem,
} from "@/types";

async function fetchStashData(userId: string): Promise<StashData> {
  const ref = stashCol(userId);
  const q = query(ref);
  const snap = await getDocs(q);
  const items: StashItem[] = [];
  snap.forEach((d) => items.push({ id: d.id, ...(d.data() as any) }));

  return { items };
}

function StashContent({ userId }: StashContainerProps) {
  const { t } = useTranslation(["stash", "common"]);
  const router = useRouter();
  const { toast } = useToast();
  const { roles } = useUserRoles();
  const homePath = resolveHomePathForRoles(roles);
  const cacheKey = `stash-${userId}`;
  const resource = getSuspenseResource(cacheKey, () => fetchStashData(userId));
  const { items: initialItems } = resource.read();

  const [items, setItems] = useState<StashItem[]>(initialItems);
  const previousItemsRef = useRef<StashItem[] | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<StashItem | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (previousItemsRef.current === initialItems) {
      return;
    }
    previousItemsRef.current = initialItems;
    setItems(initialItems);
  }, [initialItems]);

  const buildUpdatePayload = (form: StashFormValues) => {
    const payload: Record<string, any> = {
      name: form.name.trim(),
      type: form.type,
      amount: form.amount.trim(),
      unit: form.unit,
    };

    const optionalFields: Record<string, string | undefined> = {
      thc: form.thc?.trim(),
      cbd: form.cbd?.trim(),
      vendor: form.vendor?.trim(),
      price: form.price?.trim(),
      notes: form.notes?.trim(),
    };

    Object.entries(optionalFields).forEach(([key, value]) => {
      if (value && value.length > 0) {
        payload[key] = value;
      } else {
        payload[key] = deleteField();
      }
    });

    return payload;
  };
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<StashFormValues>({
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

  const fetchItems = async () => {
    if (!userId) return;
    try {
      const ref = stashCol(userId);
      const q = query(ref);
      const snap = await getDocs(q);
      const list: StashItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setItems(list);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("error", { ns: "common" }),
        description: e?.message || String(e),
      });
    }
  };

  const openNew = () => {
    router.push(ROUTE_STASH_NEW);
  };

  const openEdit = (item: StashItem) => {
    setEditing({ ...item });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditing(null);
    reset();
  };

  const onSubmit = async (data: StashFormValues) => {
    if (!userId || !editing) return;
    setSaving(true);
    try {
      const itemRef = doc(db, stashCol(userId).path, editing.id);
      const payload = buildUpdatePayload(data);
      await updateDoc(itemRef, payload);
      await fetchItems();
      closeEdit();
      toast({
        title: t("updated", { ns: "common" }),
        description: t("updatedDesc", { ns: "stash" }),
      });
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

  const deleteItem = async (item: StashItem) => {
    if (!userId) return;
    try {
      const itemRef = doc(db, stashCol(userId).path, item.id);
      await deleteDoc(itemRef);
      await fetchItems();
      toast({
        title: t("deleted", { ns: "stash" }),
        description: t("itemDeleted", { ns: "stash" }),
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("error", { ns: "common" }),
        description: e?.message || String(e),
      });
    }
  };

  // Use current items or fallback to initial
  const currentItems = items.length > 0 ? items : initialItems;

  return (
    <>
      <ResponsivePageHeader
        className="mb-6"
        title={t("title")}
        description={t("description")}
        onBackClick={() => router.replace(homePath)}
        desktopActions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            {t("addItem")}
          </Button>
        }
        mobileActions={
          <Button size="icon" onClick={openNew}>
            <Plus className="h-5 w-5" />
          </Button>
        }
        sticky={false}
      />

      {/* Content */}
      <div className="px-4 md:px-6">
        {currentItems.length === 0 ? (
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("empty")}</h3>
            <p className="text-muted-foreground mb-6">{t("emptyDesc")}</p>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              {t("addItem")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map((item) => (
              <Card key={item.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight pr-16">
                      {item.name}
                    </CardTitle>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteItem(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="capitalize">
                    {t(`types.${item.type}`, { ns: "stash" })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {item.amount && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("amount", { ns: "stash" })}:
                      </span>
                      <span className="text-sm">
                        {item.amount} {item.unit || "g"}
                      </span>
                    </div>
                  )}
                  {item.thc && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        THC:
                      </span>
                      <span className="text-sm">{item.thc}%</span>
                    </div>
                  )}
                  {item.cbd && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        CBD:
                      </span>
                      <span className="text-sm">{item.cbd}%</span>
                    </div>
                  )}
                  {item.vendor && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("vendor", { ns: "stash" })}:
                      </span>
                      <span className="text-sm">{item.vendor}</span>
                    </div>
                  )}
                  {item.price && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("price", { ns: "stash" })}:
                      </span>
                      <span className="text-sm">${item.price}</span>
                    </div>
                  )}
                  {item.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        {item.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editItem")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("name")}</label>
              <Input
                {...register("name", { required: true })}
                defaultValue={editing?.name || ""}
                placeholder={t("namePlaceholder")}
              />
              {errors.name && (
                <p className="text-destructive text-sm mt-1">
                  {t("required", { ns: "common" })}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">{t("type")}</label>
              <Select
                value={watch("type")}
                onValueChange={(value: "flower" | "concentrate" | "edible") =>
                  setValue("type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flower">{t("types.flower")}</SelectItem>
                  <SelectItem value="concentrate">
                    {t("types.concentrate")}
                  </SelectItem>
                  <SelectItem value="edible">{t("types.edible")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">{t("amount")}</label>
                <Input
                  {...register("amount")}
                  defaultValue={editing?.amount || ""}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("unit")}</label>
                <Select
                  value={watch("unit")}
                  onValueChange={(value) => setValue("unit", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="units">{t("units")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">THC %</label>
                <Input
                  {...register("thc")}
                  defaultValue={editing?.thc || ""}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">CBD %</label>
                <Input
                  {...register("cbd")}
                  defaultValue={editing?.cbd || ""}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">{t("vendor")}</label>
              <Input
                {...register("vendor")}
                defaultValue={editing?.vendor || ""}
                placeholder={t("vendorPlaceholder")}
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t("price")}</label>
              <Input
                {...register("price")}
                defaultValue={editing?.price || ""}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t("notes")}</label>
              <Textarea
                {...register("notes")}
                defaultValue={editing?.notes || ""}
                placeholder={t("notesPlaceholder")}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeEdit}
                disabled={saving}
              >
                {t("cancel", { ns: "common" })}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? t("saving", { ns: "common" })
                  : t("save", { ns: "common" })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StashSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

export function StashContainer({ userId }: StashContainerProps) {
  return (
    <Suspense fallback={<StashSkeleton />}>
      <StashContent userId={userId} />
    </Suspense>
  );
}
