"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ROUTE_LOGIN } from "@/lib/routes";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// removed select components for light schedule; using free text input now
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Layout } from "@/components/layout";
import { Calendar } from "lucide-react";
import { AnimatedLogo } from "@/components/common/animated-logo";
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
import {
  SEED_TYPES,
  GROW_TYPES,
  requiresLightSchedule,
  isValidLightSchedule,
  type SeedType,
  type GrowType,
  type LightSchedule,
} from "@/lib/plant-config";

export default function NewPlantPage() {
  const { t, language } = useTranslation(["plants", "common", "validation"]);
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
      };

      const plantsRef = collection(db, "users", userId, "plants");
      const docRef = await addDoc(plantsRef, plantData);

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
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t("newPlant.title", { ns: "plants" })}</CardTitle>
            <CardDescription>{t("newPlant.description", { ns: "plants" })}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={rhfHandleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t("newPlant.name", { ns: "plants" })}</Label>
                <Input
                  id="name"
                  placeholder={t("newPlant.namePlaceholder", { ns: "plants" })}
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
                <Label>{t("newPlant.plantingDate", { ns: "plants" })}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !plantingDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {plantingDate ? (
                        formatDateObjectWithLocale(
                          plantingDate,
                          "PPP",
                          language
                        )
                      ) : (
                        <span>{t("newPlant.pickDate", { ns: "plants" })}</span>
                      )}
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
                <Label htmlFor="seedBank">{t("newPlant.seedBank", { ns: "plants" })}</Label>
                <Input
                  id="seedBank"
                  placeholder={t("newPlant.seedBankPlaceholder", { ns: "plants" })}
                  {...register("seedBank")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("newPlant.photos", { ns: "plants" })}</Label>
                <ImageUpload
                  onImagesChange={setPhotos}
                  maxImages={DEFAULT_MAX_IMAGES}
                  maxSizeMB={DEFAULT_MAX_SIZE_MB}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <AnimatedLogo size={16} className="mr-2 text-primary" duration={1.2} />
                    {t("newPlant.loading", { ns: "plants" })}
                  </>
                ) : (
                  t("newPlant.submit", { ns: "plants" })
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
