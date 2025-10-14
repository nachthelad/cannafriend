"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ROUTE_LOGIN, ROUTE_PLANTS } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// removed select components for light schedule; using free text input now
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { invalidateDashboardCache, invalidatePlantsCache } from "@/lib/suspense-cache";
import { onAuthStateChanged } from "firebase/auth";
import { Layout } from "@/components/layout";
import { Calendar } from "lucide-react";
import { formatDateObjectWithLocale } from "@/lib/utils";
import { LocalizedCalendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/common/image-upload";
import { DEFAULT_MAX_IMAGES, DEFAULT_MAX_SIZE_MB } from "@/lib/image-config";
import { MobileDatePicker } from "@/components/ui/mobile-date-picker";
import { es, enUS } from "date-fns/locale";
import {
  SEED_TYPES,
  GROW_TYPES,
  PLANT_STATUS,
  requiresLightSchedule,
  isValidLightSchedule,
  type SeedType,
  type GrowType,
  type LightSchedule,
} from "@/lib/plant-config";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";

export default function NewPlantPage() {
  const { t, i18n } = useTranslation(["plants", "common", "validation"]);
  const router = useRouter();
  const { toast } = useToast();
  const { handleFirebaseError, handleValidationError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state (RHF)
  type PlantForm = {
    name: string;
    seedType: SeedType | "";
    growType: GrowType | "";
    lightSchedule: LightSchedule | "";
    seedBank?: string;
  };
  const {
    register,
    handleSubmit: rhfHandleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PlantForm>({
    defaultValues: {
      name: "",
      seedType: "",
      growType: "",
      lightSchedule: "",
      seedBank: "",
    },
  });
  const name = watch("name");
  const seedType = watch("seedType");
  const growType = watch("growType");
  const lightSchedule = watch("lightSchedule");
  const seedBank = watch("seedBank");
  const [plantingDate, setPlantingDate] = useState<Date | undefined>(
    new Date()
  );
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        router.push(ROUTE_LOGIN);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const onSubmit = async () => {
    if (!userId || !plantingDate) return;

    setIsLoading(true);

    try {
      const plantData = {
        name,
        seedType,
        growType,
        plantingDate: new Date(
          plantingDate.getFullYear(),
          plantingDate.getMonth(),
          plantingDate.getDate()
        ).toISOString(),
        lightSchedule:
          seedType && growType && requiresLightSchedule(seedType, growType)
            ? lightSchedule
            : null,
        seedBank: (seedBank || "").trim() || null,
        photos: photos.length > 0 ? photos : null,
        coverPhoto: photos.length > 0 ? photos[0] : null,
        createdAt: new Date().toISOString(),
        status: PLANT_STATUS.GROWING,
        endedAt: null,
      };

      const plantsRef = collection(db, "users", userId, "plants");
      const docRef = await addDoc(plantsRef, plantData);

      // Invalidate caches to refresh plants list and dashboard count
      invalidatePlantsCache(userId);
      invalidateDashboardCache(userId);

      toast({
        title: t("newPlant.success", { ns: "plants" }),
        description: t("newPlant.successMessage", { ns: "plants" }),
      });

      router.push(`/plants/${docRef.id}`);
    } catch (error: any) {
      handleFirebaseError(error, "plant creation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <ResponsivePageHeader
        title={t("newPlant.title", { ns: "plants" })}
        description={t("newPlant.description", { ns: "plants" })}
        onBackClick={() => router.push(ROUTE_PLANTS)}
      />

      {/* Form */}
      <form onSubmit={rhfHandleSubmit(onSubmit)} className="max-w-2xl px-4 md:px-6">
        <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-base font-medium">
                  {t("newPlant.name", { ns: "plants" })}
                </label>
                <Input
                  id="name"
                  placeholder={t("newPlant.namePlaceholder", { ns: "plants" })}
                  className="min-h-[48px] text-base"
                  {...register("name", {
                    validate: (v) =>
                      (v && v.trim().length > 0) ||
                      (t("required", { ns: "validation" }) as string),
                  })}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {String(errors.name.message)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("newPlant.seedType", { ns: "plants" })}</Label>
                {/* Hidden field to register for validation */}
                <input
                  type="hidden"
                  {...register("seedType", {
                    required: t("required", { ns: "validation" }) as string,
                  })}
                  value={seedType || ""}
                />
                <RadioGroup
                  value={seedType}
                  onValueChange={(value) =>
                    setValue("seedType", value as SeedType)
                  }
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={SEED_TYPES.AUTOFLOWERING}
                      id="autoflowering"
                    />
                    <Label htmlFor="autoflowering" className="font-normal">
                      {t("newPlant.autoflowering", { ns: "plants" })}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={SEED_TYPES.PHOTOPERIODIC}
                      id="photoperiodic"
                    />
                    <Label htmlFor="photoperiodic" className="font-normal">
                      {t("newPlant.photoperiodic", { ns: "plants" })}
                    </Label>
                  </div>
                </RadioGroup>
                {errors.seedType && (
                  <p className="text-xs text-destructive">
                    {String(errors.seedType.message)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("newPlant.growType", { ns: "plants" })}</Label>
                <input
                  type="hidden"
                  {...register("growType", {
                    required: t("required", { ns: "validation" }) as string,
                  })}
                  value={growType || ""}
                />
                <RadioGroup
                  value={growType}
                  onValueChange={(value) =>
                    setValue("growType", value as GrowType)
                  }
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={GROW_TYPES.INDOOR} id="indoor" />
                    <Label htmlFor="indoor" className="font-normal">
                      {t("newPlant.indoor", { ns: "plants" })}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={GROW_TYPES.OUTDOOR} id="outdoor" />
                    <Label htmlFor="outdoor" className="font-normal">
                      {t("newPlant.outdoor", { ns: "plants" })}
                    </Label>
                  </div>
                </RadioGroup>
                {errors.growType && (
                  <p className="text-xs text-destructive">
                    {String(errors.growType.message)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-base font-medium">
                  {t("newPlant.plantingDate", { ns: "plants" })}
                </label>
                <div className="md:hidden">
                  <MobileDatePicker
                    selected={plantingDate}
                    onSelect={(d) => d && setPlantingDate(d)}
                    locale={t("language", { ns: "common" }) === "es" ? es : enUS}
                  />
                </div>
                <div className="hidden md:block">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal min-h-[48px] text-base",
                          !plantingDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {plantingDate
                          ? formatDateObjectWithLocale(
                              plantingDate,
                              "PPP",
                              i18n.language
                            )
                          : t("newPlant.pickDate", { ns: "plants" })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={plantingDate}
                        onSelect={setPlantingDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {growType &&
                seedType &&
                requiresLightSchedule(seedType, growType) && (
                  <div className="space-y-2">
                    <Label htmlFor="lightSchedule">
                      {t("newPlant.lightSchedule", { ns: "plants" })}
                    </Label>
                    <Input
                      id="lightSchedule"
                      placeholder={t("newPlant.lightSchedulePlaceholder", { ns: "plants" })}
                      {...register("lightSchedule", {
                        validate: (v) => {
                          if (!v || !v.trim())
                            return t("required", { ns: "validation" }) as string;
                          const ok = isValidLightSchedule(v.trim());
                          return (
                            ok ||
                            (t("invalidLightSchedule", { ns: "validation" }) as string)
                          );
                        },
                      })}
                    />
                    {errors.lightSchedule && (
                      <p className="text-xs text-destructive">
                        {String(errors.lightSchedule.message)}
                      </p>
                    )}
                  </div>
                )}

              <div className="space-y-2">
                <label htmlFor="seedBank" className="text-base font-medium">
                  {t("newPlant.seedBank", { ns: "plants" })}
                </label>
                <Input
                  id="seedBank"
                  placeholder={t("newPlant.seedBankPlaceholder", { ns: "plants" })}
                  className="min-h-[48px] text-base"
                  {...register("seedBank")}
                />
              </div>

              <div className="space-y-2">
                <label className="text-base font-medium">
                  {t("newPlant.photos", { ns: "plants" })}
                </label>
                <ImageUpload
                  onImagesChange={setPhotos}
                  maxImages={DEFAULT_MAX_IMAGES}
                  maxSizeMB={DEFAULT_MAX_SIZE_MB}
                  userId={userId ?? undefined}
                />
                {photos.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photos.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative w-full aspect-square overflow-hidden rounded-md border"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`photo ${idx + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 pb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(ROUTE_PLANTS)}
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
                    ? t("newPlant.loading", { ns: "plants" })
                    : t("newPlant.submit", { ns: "plants" })}
                </Button>
              </div>
            </div>
          </form>
    </Layout>
  );
}
