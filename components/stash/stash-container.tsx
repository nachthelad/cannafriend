"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ROUTE_DASHBOARD } from "@/lib/routes";
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
import {
  Plus,
  Pencil,
  Trash2,
  Flower,
  Droplets,
  Cookie,
  Package,
  DollarSign,
  Scale,
  Tag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { getSuspenseResource } from "@/lib/suspense-utils";
import type {
  StashContainerProps,
  StashData,
  StashFormValues,
  StashItem,
} from "@/types";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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
  const homePath = ROUTE_DASHBOARD;
  const cacheKey = `stash-${userId}`;
  const resource = getSuspenseResource(cacheKey, () => fetchStashData(userId));
  const { items: initialItems } = resource.read();

  const [items, setItems] = useState<StashItem[]>(initialItems);
  const previousItemsRef = useRef<StashItem[] | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<StashItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<StashItem | null>(null);

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

  const openEdit = (item: StashItem) => {
    setEditing({ ...item });
    reset(item);
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

  const handleDeleteClick = (item: StashItem) => {
    setItemToDelete(item);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!userId || !itemToDelete) return;
    try {
      const itemRef = doc(db, stashCol(userId).path, itemToDelete.id);
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
    } finally {
      setDeleteOpen(false);
      setItemToDelete(null);
    }
  };

  // Use current items or fallback to initial
  const currentItems = items.length > 0 ? items : initialItems;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "flower":
        return Flower;
      case "concentrate":
        return Droplets;
      case "edible":
        return Cookie;
      default:
        return Package;
    }
  };

  return (
    <>
      <ResponsivePageHeader
        className="mb-6"
        title={t("title")}
        description={t("description")}
        onBackClick={() => router.replace(homePath)}
        desktopActions={
          <Button asChild>
            <Link href={ROUTE_STASH_NEW}>
              <Plus className="h-4 w-4 mr-2" />
              {t("addItem")}
            </Link>
          </Button>
        }
        mobileActions={
          <Button size="icon" asChild>
            <Link href={ROUTE_STASH_NEW}>
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        }
        sticky={false}
      />

      {/* Content */}
      <div className="px-4 md:px-6">
        {currentItems.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t("empty")}
            description={t("emptyDesc")}
            action={{
              label: t("addItem"),
              href: ROUTE_STASH_NEW,
              icon: Plus,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map((item) => {
              const Icon = getTypeIcon(item.type);
              return (
                <Card
                  key={item.id}
                  variant="interactive"
                  className="group relative overflow-hidden hover:border-primary/50"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg leading-tight">
                            {item.name}
                          </CardTitle>
                          <div className="text-sm text-muted-foreground capitalize mt-0.5">
                            {t(`types.${item.type}`, { ns: "stash" })}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteClick(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {item.amount && (
                        <div className="bg-muted/30 p-2 rounded-md">
                          <span className="text-xs text-muted-foreground block mb-0.5">
                            {t("amount", { ns: "stash" })}
                          </span>
                          <div className="flex items-center gap-1.5 font-medium text-sm">
                            <Scale className="h-3.5 w-3.5 text-primary/70" />
                            {item.amount} {item.unit || "g"}
                          </div>
                        </div>
                      )}
                      {item.price && (
                        <div className="bg-muted/30 p-2 rounded-md">
                          <span className="text-xs text-muted-foreground block mb-0.5">
                            {t("price", { ns: "stash" })}
                          </span>
                          <div className="flex items-center gap-1.5 font-medium text-sm">
                            <DollarSign className="h-3.5 w-3.5 text-primary/70" />
                            ${item.price}
                          </div>
                        </div>
                      )}
                    </div>

                    {(item.thc || item.cbd) && (
                      <div className="flex items-center gap-2">
                        {item.thc && (
                          <Badge
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            THC: {item.thc}%
                          </Badge>
                        )}
                        {item.cbd && (
                          <Badge
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            CBD: {item.cbd}%
                          </Badge>
                        )}
                      </div>
                    )}

                    {item.vendor && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="h-3.5 w-3.5" />
                        <span>{item.vendor}</span>
                      </div>
                    )}

                    {item.notes && (
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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
                <Input {...register("amount")} placeholder="0" />
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
                <Input {...register("thc")} placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-medium">CBD %</label>
                <Input {...register("cbd")} placeholder="0" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">{t("vendor")}</label>
              <Input
                {...register("vendor")}
                placeholder={t("vendorPlaceholder")}
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t("price")}</label>
              <Input {...register("price")} placeholder="0.00" />
            </div>

            <div>
              <label className="text-sm font-medium">{t("notes")}</label>
              <Textarea
                {...register("notes")}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteConfirmTitle", {
                ns: "stash",
                defaultValue: "¿Estás seguro?",
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDesc", {
                ns: "stash",
                defaultValue:
                  "Esta acción no se puede deshacer. Esto eliminará permanentemente el elemento de tu stash.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("cancel", { ns: "common" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("delete", { ns: "common" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
