"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ROUTE_PLANTS } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// removed select components for light schedule; using free text input now
import { useTranslation } from "react-i18next";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useAuthUser } from "@/hooks/use-auth-user";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import {
  invalidateDashboardCache,
  invalidatePlantsCache,
  optimisticAddPlant,
} from "@/lib/suspense-cache";
import { normalizePlant } from "@/lib/plant-utils";
import { Calendar, Check } from "lucide-react";
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
import {
  WorkbenchSurface,
} from "@/components/common/desktop-form-workbench";
import { toast } from "sonner";

function DesktopChoiceTile({
  label,
  selected,
  htmlFor,
  children,
}: {
  label: string;
  selected: boolean;
  htmlFor: string;
  children?: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className={cn(
        "flex min-h-[72px] cursor-pointer flex-col items-start justify-center gap-2 rounded-2xl border px-4 py-4 transition-[border-color,background-color,box-shadow,transform]",
        selected
          ? "border-primary/60 bg-primary/10 shadow-[0_18px_40px_-28px_rgba(74,222,128,0.8)]"
          : "border-border/70 bg-card/50 hover:border-primary/30 hover:bg-card"
      )}
    >
      <div className="flex items-center gap-2">
        {selected ? <Check className="h-4 w-4 text-primary" /> : null}
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      {children ? (
        <span className="text-xs leading-relaxed text-muted-foreground">
          {children}
        </span>
      ) : null}
    </Label>
  );
}

export default function NewPlantPage() {
  const { t, i18n } = useTranslation(["plants", "common", "validation"]);
  const router = useRouter();
  const { handleFirebaseError, handleValidationError } = useErrorHandler();
  const { user } = useAuthUser();
  const [isLoading, setIsLoading] = useState(false);
  const userId = user?.uid ?? null;

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
  const seedType = watch("seedType");
  const growType = watch("growType");
  const lightSchedule = watch("lightSchedule");
  const seedBank = watch("seedBank");
  const [plantingDate, setPlantingDate] = useState<Date | undefined>(
    new Date()
  );
  const [photos, setPhotos] = useState<string[]>([]);

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

      // Optimistically prepend new plant so the list updates instantly
      optimisticAddPlant(userId, normalizePlant(plantData, docRef.id));

      // Invalidate full caches (dashboard count + any other plant views)
      invalidatePlantsCache(userId);
      invalidateDashboardCache(userId);

      router.push(`/plants/${docRef.id}`);
    } catch (error: any) {
      handleFirebaseError(error, "plant creation");
      toast.error(t("toast.saveError", { ns: "plants" }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <>
      <ResponsivePageHeader
        title={t("newPlant.title", { ns: "plants" })}
        description={t("newPlant.description", { ns: "plants" })}
        onBackClick={() => router.push(ROUTE_PLANTS)}
      />

      <form
        onSubmit={rhfHandleSubmit(onSubmit)}
        className="mx-auto max-w-5xl px-4 pb-8 md:px-6"
      >
        <WorkbenchSurface className="space-y-6 xl:bg-card/80">
            <div className="space-y-2">
              <label htmlFor="name" className="text-base font-medium">
                {t("newPlant.name", { ns: "plants" })}
              </label>
              <Input
                id="name"
                autoComplete="off"
                placeholder={t("newPlant.namePlaceholder", { ns: "plants" })}
                className="min-h-[52px] rounded-2xl text-base xl:bg-background/70"
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

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>{t("newPlant.photos", { ns: "plants" })}</Label>
                <span className="text-xs text-muted-foreground">
                  {photos.length > 0
                    ? `${photos.length} ${t("photos.photos", { ns: "plants" })}`
                    : t("photos.noPhotos", { ns: "plants" })}
                </span>
              </div>

              <ImageUpload
                onImagesChange={setPhotos}
                maxImages={DEFAULT_MAX_IMAGES}
                maxSizeMB={DEFAULT_MAX_SIZE_MB}
                userId={userId ?? undefined}
                enableDropzone
                buttonSize="default"
                className="xl:[&_button]:rounded-2xl xl:[&_button]:px-4"
              />

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {photos.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square overflow-hidden rounded-xl border border-white/8 bg-muted/40"
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

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-3">
                <Label>{t("newPlant.seedType", { ns: "plants" })}</Label>
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
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <div>
                    <RadioGroupItem
                      value={SEED_TYPES.AUTOFLOWERING}
                      id="autoflowering"
                      className="sr-only"
                    />
                    <DesktopChoiceTile
                      htmlFor="autoflowering"
                      label={t("newPlant.autoflowering", { ns: "plants" })}
                      selected={seedType === SEED_TYPES.AUTOFLOWERING}
                    />
                  </div>
                  <div>
                    <RadioGroupItem
                      value={SEED_TYPES.PHOTOPERIODIC}
                      id="photoperiodic"
                      className="sr-only"
                    />
                    <DesktopChoiceTile
                      htmlFor="photoperiodic"
                      label={t("newPlant.photoperiodic", { ns: "plants" })}
                      selected={seedType === SEED_TYPES.PHOTOPERIODIC}
                    />
                  </div>
                </RadioGroup>
                {errors.seedType && (
                  <p className="text-xs text-destructive">
                    {String(errors.seedType.message)}
                  </p>
                )}
              </div>

              <div className="space-y-3">
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
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <div>
                    <RadioGroupItem
                      value={GROW_TYPES.INDOOR}
                      id="indoor"
                      className="sr-only"
                    />
                    <DesktopChoiceTile
                      htmlFor="indoor"
                      label={t("newPlant.indoor", { ns: "plants" })}
                      selected={growType === GROW_TYPES.INDOOR}
                    />
                  </div>
                  <div>
                    <RadioGroupItem
                      value={GROW_TYPES.OUTDOOR}
                      id="outdoor"
                      className="sr-only"
                    />
                    <DesktopChoiceTile
                      htmlFor="outdoor"
                      label={t("newPlant.outdoor", { ns: "plants" })}
                      selected={growType === GROW_TYPES.OUTDOOR}
                    />
                  </div>
                </RadioGroup>
                {errors.growType && (
                  <p className="text-xs text-destructive">
                    {String(errors.growType.message)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-2">
                <label className="text-base font-medium">
                  {t("newPlant.plantingDate", { ns: "plants" })}
                </label>
                <div className="md:hidden">
                  <MobileDatePicker
                    selected={plantingDate}
                    onSelect={(d) => d && setPlantingDate(d)}
                    locale={
                      t("language", { ns: "common" }) === "es" ? es : enUS
                    }
                  />
                </div>
                <div className="hidden md:block">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "min-h-[52px] w-full justify-start rounded-2xl text-left text-base font-normal xl:bg-background/70",
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

              <div className="space-y-2">
                <label htmlFor="seedBank" className="text-base font-medium">
                  {t("newPlant.seedBank", { ns: "plants" })}
                </label>
                <Input
                  id="seedBank"
                  autoComplete="organization"
                  placeholder={t("newPlant.seedBankPlaceholder", {
                    ns: "plants",
                  })}
                  className="min-h-[52px] rounded-2xl text-base xl:bg-background/70"
                  {...register("seedBank")}
                />
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
                    autoComplete="off"
                    placeholder={t("newPlant.lightSchedulePlaceholder", {
                      ns: "plants",
                    })}
                    className="min-h-[52px] rounded-2xl xl:bg-background/70"
                    {...register("lightSchedule", {
                      validate: (v) => {
                        if (!v || !v.trim())
                          return t("required", { ns: "validation" }) as string;
                        const ok = isValidLightSchedule(v.trim());
                        return (
                          ok ||
                          (t("invalidLightSchedule", {
                            ns: "validation",
                          }) as string)
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
          </WorkbenchSurface>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTE_PLANTS)}
            className="min-h-[48px] rounded-2xl sm:min-w-[160px]"
          >
            {t("cancel", { ns: "common" })}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="min-h-[48px] rounded-2xl px-8 sm:min-w-[220px]"
          >
            {isLoading
              ? t("newPlant.loading", { ns: "plants" })
              : t("newPlant.submit", { ns: "plants" })}
          </Button>
        </div>
      </form>
    </>
  );
}
