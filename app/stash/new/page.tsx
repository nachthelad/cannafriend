"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { AlertCircle } from "lucide-react";
import { ROUTE_STASH } from "@/lib/routes";
import { db } from "@/lib/firebase";
import { addDoc } from "firebase/firestore";
import { stashCol } from "@/lib/paths";
import { clearSuspenseCache } from "@/lib/suspense-utils";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { Skeleton } from "@/components/ui/skeleton";

// Form validation schema
const createStashFormSchema = (t: any) =>
  z.object({
    name: z.string().min(1, t("nameRequired", { ns: "validation" })),
    type: z.string().min(1, t("typeRequired", { ns: "validation" })),
    amount: z.string().min(1, t("amountRequired", { ns: "validation" })),
    unit: z.string().min(1, t("unitRequired", { ns: "validation" })),
    thc: z.string().optional(),
    cbd: z.string().optional(),
    vendor: z.string().optional(),
    price: z.string().optional(),
    notes: z.string().max(500, t("notesMaxLength", { ns: "validation" })),
  });

type StashFormData = z.infer<ReturnType<typeof createStashFormSchema>>;

function StashFormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-60" />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function NewStashPageContent() {
  const { t } = useTranslation(["stash", "common", "validation"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuthUser();
  const [isLoading, setIsLoading] = useState(false);

  // Get return path from URL params
  const returnTo = searchParams.get("returnTo");

  const formSchema = createStashFormSchema(t);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<StashFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      amount: "",
      unit: "g",
      thc: "",
      cbd: "",
      vendor: "",
      price: "",
      notes: "",
    },
  });

  const typeValue = watch("type");
  const unitValue = watch("unit");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  const handleBack = () => {
    router.push(ROUTE_STASH);
  };

  const onSubmit = async (data: StashFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const stashData: Record<string, string> = {
        name: data.name.trim(),
        type: data.type,
        amount: data.amount.trim(),
        unit: data.unit,
        addedAt: new Date().toISOString(),
      };

      const optionalFields: Record<string, string | undefined> = {
        thc: data.thc?.trim(),
        cbd: data.cbd?.trim(),
        vendor: data.vendor?.trim(),
        price: data.price?.trim(),
        notes: data.notes?.trim(),
      };

      Object.entries(optionalFields).forEach(([key, value]) => {
        if (value && value.length > 0) {
          stashData[key] = value;
        }
      });

      const stashRef = stashCol(user.uid);
      await addDoc(stashRef, stashData);

      toast({
        title: t("addSuccess", { ns: "stash" }),
        description: t("addSuccessDesc", { ns: "stash" }),
      });

      clearSuspenseCache(`stash-${user.uid}`);
      router.push(ROUTE_STASH);
    } catch (error: any) {
      console.error("Error adding stash item:", error);
      toast({
        variant: "destructive",
        title: t("addError", { ns: "stash" }),
        description: error?.message || t("addErrorDesc", { ns: "stash" }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <StashFormSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <ResponsivePageHeader
        title={t("addItem", { ns: "stash" })}
        description={t("addItemDesc", { ns: "stash" })}
        onBackClick={handleBack}
      />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl px-4 md:px-6">
        <div className="space-y-6">
          {/* Name */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-base font-medium">
              {t("name", { ns: "stash" })} *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder={t("namePlaceholder", { ns: "stash" })}
              className="min-h-[48px] text-base"
              {...register("name")}
            />
            {errors.name && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {errors.name.message}
                </p>
              </div>
            )}
          </div>

          {/* Type */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t("type", { ns: "stash" })} *
            </Label>
            <Select
              value={typeValue}
              onValueChange={(value) => setValue("type", value)}
            >
              <SelectTrigger className="min-h-[48px] text-base">
                <SelectValue placeholder={t("selectType", { ns: "stash" })} />
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
            {errors.type && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {errors.type.message}
                </p>
              </div>
            )}
          </div>

          {/* Amount & Unit */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t("amount", { ns: "stash" })} *
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="0.0"
                className="min-h-[48px] text-base"
                {...register("amount")}
              />
              <Select
                value={unitValue}
                onValueChange={(value) => setValue("unit", value)}
              >
                <SelectTrigger className="min-h-[48px] text-base">
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
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {errors.amount.message}
                </p>
              </div>
            )}
          </div>

          {/* THC & CBD */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <Label htmlFor="thc" className="text-base font-medium">
                {t("thc", { ns: "stash" })}
              </Label>
              <Input
                id="thc"
                type="text"
                placeholder="25%"
                className="min-h-[48px] text-base"
                {...register("thc")}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="cbd" className="text-base font-medium">
                {t("cbd", { ns: "stash" })}
              </Label>
              <Input
                id="cbd"
                type="text"
                placeholder="1%"
                className="min-h-[48px] text-base"
                {...register("cbd")}
              />
            </div>
          </div>

          {/* Vendor & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <Label htmlFor="vendor" className="text-base font-medium">
                {t("vendor", { ns: "stash" })}
              </Label>
              <Input
                id="vendor"
                type="text"
                placeholder={t("vendorPlaceholder", { ns: "stash" })}
                className="min-h-[48px] text-base"
                {...register("vendor")}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="price" className="text-base font-medium">
                {t("price", { ns: "stash" })}
              </Label>
              <Input
                id="price"
                type="text"
                placeholder="$50"
                className="min-h-[48px] text-base"
                {...register("price")}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-medium">
              {t("notes", { ns: "stash" })}
            </Label>
            <Textarea
              id="notes"
              placeholder={t("notesPlaceholder", { ns: "stash" })}
              className="min-h-[100px] text-base resize-none"
              {...register("notes")}
            />
            {errors.notes && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {errors.notes.message}
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="flex-1 min-h-[48px] text-base"
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 min-h-[48px] text-base"
            >
              {isLoading
                ? t("saving", { ns: "common" })
                : t("save", { ns: "common" })}
            </Button>
          </div>
        </div>
      </form>
    </Layout>
  );
}

export default function NewStashPage() {
  return (
    <Suspense fallback={
      <Layout>
        <StashFormSkeleton />
      </Layout>
    }>
      <NewStashPageContent />
    </Suspense>
  );
}

