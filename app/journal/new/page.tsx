"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { Layout } from "@/components/layout";
import { Calendar, AlertCircle } from "lucide-react";
import { ROUTE_JOURNAL } from "@/lib/routes";
import { Skeleton } from "@/components/ui/skeleton";

import { auth, db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query } from "firebase/firestore";
import {
  invalidateDashboardCache,
  invalidateJournalCache,
  invalidatePlantsCache,
  invalidatePlantDetails,
} from "@/lib/suspense-cache";
import {
  LOG_TYPES,
  LOG_TYPE_OPTIONS,
  WATERING_METHOD_OPTIONS,
  TRAINING_METHOD_OPTIONS,
  type LogType,
  type WateringMethod,
  type TrainingMethod,
} from "@/lib/log-config";
import { buildLogsPath, buildEnvironmentPath } from "@/lib/firebase-config";
import { plantsCol } from "@/lib/paths";
import { formatDateObjectWithLocale } from "@/lib/utils";
import { LocalizedCalendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Plant } from "@/types";
import { AmountWithUnit } from "@/components/common/amount-with-unit";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";

function JournalFormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>

        <div className="flex gap-3 pt-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Form validation schema - will be created with translations in component
const createLogFormSchema = (t: any) =>
  z
    .object({
      logType: z.string().min(1, t("logTypeRequired", { ns: "validation" })),
      date: z.date(),
      notes: z.string().max(500, t("notesMaxLength", { ns: "validation" })),
      wateringAmount: z.string().optional(),
      wateringMethod: z.string().optional(),
      wateringUnit: z.string().optional(),
      feedingNpk: z.string().optional(),
      feedingAmount: z.string().optional(),
      feedingUnit: z.string().optional(),
      trainingMethod: z.string().optional(),
      temperature: z.string().optional(),
      humidity: z.string().optional(),
      ph: z.string().optional(),
      light: z.string().optional(),
      lightSchedule: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      // Watering log validation
      if (data.logType === LOG_TYPES.WATERING) {
        if (!data.wateringAmount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("waterAmountRequired", { ns: "validation" }),
            path: ["wateringAmount"],
          });
        }
        if (!data.wateringMethod) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("waterMethodRequired", { ns: "validation" }),
            path: ["wateringMethod"],
          });
        }
      }

      // Feeding log validation
      if (data.logType === LOG_TYPES.FEEDING) {
        if (!data.feedingAmount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("nutrientAmountRequired", { ns: "validation" }),
            path: ["feedingAmount"],
          });
        } else {
          const amount = parseFloat(data.feedingAmount);
          if (isNaN(amount) || amount <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("nutrientAmountInvalid", { ns: "validation" }),
              path: ["feedingAmount"],
            });
          } else if (amount > 50) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("nutrientAmountTooLarge", { ns: "validation" }),
              path: ["feedingAmount"],
            });
          }
        }
      }

      // Training log validation
      if (data.logType === LOG_TYPES.TRAINING && !data.trainingMethod) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("trainingMethodRequired", { ns: "validation" }),
          path: ["trainingMethod"],
        });
      }

      // Environment log validation
      if (data.logType === LOG_TYPES.ENVIRONMENT) {
        const hasAnyValue =
          data.temperature || data.humidity || data.ph || data.light;
        if (!hasAnyValue) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("environmentValueRequired", { ns: "validation" }),
            path: ["temperature"],
          });
        }
      }

      // Flowering log validation
      if (data.logType === LOG_TYPES.FLOWERING) {
        if (!data.lightSchedule?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("lightScheduleRequired", { ns: "validation" }),
            path: ["lightSchedule"],
          });
        }
      }

      // Notes/Observation log validation
      if (data.logType === LOG_TYPES.NOTE) {
        if (!data.notes?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("notesRequired", { ns: "validation" }),
            path: ["notes"],
          });
        }
      }
    });

type LogFormSchema = ReturnType<typeof createLogFormSchema>;
type LogFormData = z.infer<LogFormSchema>;

function NewJournalPageContent() {
  const { t } = useTranslation(["journal", "common", "validation"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthUser();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const userId = user?.uid ?? null;

  const [isLoading, setIsLoading] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<string>("");
  const [plantsLoading, setPlantsLoading] = useState<boolean>(true);

  // Get plant ID from URL params if provided
  const urlPlantId = searchParams.get("plantId");
  const returnTo = searchParams.get("returnTo");

  // Create schema with translations
  const logFormSchema = useMemo(() => createLogFormSchema(t), [t]);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    register,
    reset,
  } = useForm<LogFormData>({
    resolver: zodResolver(logFormSchema),
    defaultValues: {
      logType: "" as LogType,
      date: new Date(),
      notes: "",
    },
    mode: "onChange",
  });

  const logType = watch("logType");
  const date = watch("date");

  // Load plants for selection
  useEffect(() => {
    const fetchPlants = async () => {
      if (!userId) {
        setPlantsLoading(false);
        return;
      }
      try {
        const q = query(plantsCol(userId));
        const snapshot = await getDocs(q);
        const plantsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Plant[];
        setPlants(plantsData);

        // Set default plant if provided in URL or use first plant
        if (urlPlantId && plantsData.find((p) => p.id === urlPlantId)) {
          setSelectedPlantId(urlPlantId);
        } else if (plantsData.length > 0) {
          setSelectedPlantId(plantsData[0].id);
        }
      } catch (error) {
        console.error("Error fetching plants:", error);
      } finally {
        setPlantsLoading(false);
      }
    };

    if (userId) {
      fetchPlants();
    }
  }, [userId, urlPlantId]);

  const onSubmit = async (data: LogFormData) => {
    if (!auth.currentUser || !data.date || !selectedPlantId) return;

    // Validation is now handled by Zod schema

    setIsLoading(true);

    try {
      let logData: any = {
        type: data.logType,
        date: data.date.toISOString(),
        notes: data.notes,
        createdAt: new Date().toISOString(),
        userId: auth.currentUser!.uid,
        plantId: selectedPlantId,
      };

      // Add type-specific fields
      switch (data.logType) {
        case LOG_TYPES.WATERING:
          logData = {
            ...logData,
            amount: Number.parseFloat(data.wateringAmount || "0"),
            method: data.wateringMethod,
            unit: (data as any).wateringUnit || "ml",
          };
          break;
        case LOG_TYPES.FEEDING:
          logData = {
            ...logData,
            npk: data.feedingNpk,
            amount: Number.parseFloat(data.feedingAmount || "0"),
            unit: (data as any).feedingUnit || "ml/L",
          };
          break;
        case LOG_TYPES.TRAINING:
          logData = {
            ...logData,
            method: data.trainingMethod,
          };
          break;
        case LOG_TYPES.ENVIRONMENT:
          logData = {
            ...logData,
            temperature: Number.parseFloat(data.temperature || "0"),
            humidity: Number.parseFloat(data.humidity || "0"),
            ph: Number.parseFloat(data.ph || "0"),
            light: Number.parseFloat(data.light || "0"),
          };

          // Also save to environment collection for charts
          const envRef = collection(
            db,
            buildEnvironmentPath(auth.currentUser!.uid, selectedPlantId)
          );
          await addDoc(envRef, {
            date: data.date.toISOString(),
            temperature: Number.parseFloat(data.temperature || "0"),
            humidity: Number.parseFloat(data.humidity || "0"),
            ph: Number.parseFloat(data.ph || "0"),
            createdAt: new Date().toISOString(),
          });
          break;
        case LOG_TYPES.FLOWERING:
          logData = {
            ...logData,
            lightSchedule: (data.lightSchedule || "").trim() || undefined,
          };
          break;
      }

      // Save log
      const logsRef = collection(
        db,
        buildLogsPath(auth.currentUser!.uid, selectedPlantId)
      );
      await addDoc(logsRef, logData);

      // Invalidate caches to refresh journal, plants (for last watering/feeding), and dashboard
      invalidateJournalCache(auth.currentUser!.uid);
      invalidatePlantsCache(auth.currentUser!.uid);
      invalidatePlantDetails(auth.currentUser!.uid, selectedPlantId); // Individual plant page
      invalidateDashboardCache(auth.currentUser!.uid);

      toast({
        title: t("logForm.success", { ns: "journal" }),
        description: t("logForm.successDesc", { ns: "journal" }),
      });

      // Redirect back to plant page if coming from there, otherwise to journal
      if (returnTo === "plant" && urlPlantId) {
        router.push(`/plants/${urlPlantId}`);
      } else {
        router.push(ROUTE_JOURNAL);
      }
    } catch (error: any) {
      console.error("Error adding log:", error);
      toast({
        variant: "destructive",
        title: t("logForm.error", { ns: "journal" }),
        description:
          error?.message || t("logForm.errorDesc", { ns: "journal" }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (plantsLoading) {
    return (
      <Layout>
        <JournalFormSkeleton />
      </Layout>
    );
  }

  const handleFormSubmit = handleSubmit(onSubmit as any);
  const handleBack = () => {
    if (returnTo === "plant" && urlPlantId) {
      router.push(`/plants/${urlPlantId}`);
    } else {
      router.push(ROUTE_JOURNAL);
    }
  };

  return (
    <Layout>
      <ResponsivePageHeader
        title={t("logForm.title", { ns: "journal" })}
        description={t("logForm.description", { ns: "journal" })}
        onBackClick={handleBack}
      />

      {/* Form */}
      <form onSubmit={handleFormSubmit} className="max-w-2xl px-4 md:px-6">
        <div className="space-y-6">
          {/* Plant Selection */}
          {plants.length > 1 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">
                {t("logForm.plant", { ns: "journal" })}
              </Label>
              <Select
                value={selectedPlantId}
                onValueChange={setSelectedPlantId}
              >
                <SelectTrigger className="min-h-[48px] text-base">
                  <SelectValue
                    placeholder={t("logForm.selectPlant", { ns: "journal" })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {plants.map((plant) => (
                    <SelectItem
                      key={plant.id}
                      value={plant.id}
                      className="min-h-[44px]"
                    >
                      {plant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Log Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t("logForm.type", { ns: "journal" })}
            </Label>
            <Select
              onValueChange={(value: LogType) => {
                setValue("logType", value);
                // Clear notes error when switching away from NOTE type
                if (errors.notes && value !== LOG_TYPES.NOTE) {
                  setValue("notes", watch("notes") || "", {
                    shouldValidate: true,
                  });
                }
              }}
            >
              <SelectTrigger
                className={`min-h-[48px] text-base ${
                  errors.logType ? "border-destructive" : ""
                }`}
              >
                <SelectValue
                  placeholder={t("logForm.selectType", { ns: "journal" })}
                />
              </SelectTrigger>
              <SelectContent>
                {LOG_TYPE_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="min-h-[44px]"
                  >
                    {t(option.label, { ns: "journal" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.logType && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {errors.logType.message}
                </p>
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t("logForm.date", { ns: "journal" })}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "min-h-[48px] text-base justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date
                    ? formatDateObjectWithLocale(date)
                    : t("logForm.selectDate", { ns: "journal" })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) =>
                    selectedDate && setValue("date", selectedDate)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Type-specific fields */}
          {logType === LOG_TYPES.WATERING && (
            <>
              <div className="space-y-3">
                <Label
                  htmlFor="wateringAmount"
                  className="text-base font-medium"
                >
                  {t("logForm.amount", { ns: "journal" })}
                </Label>
                <AmountWithUnit
                  inputId="wateringAmount"
                  placeholder="0.5"
                  inputProps={{
                    type: "number",
                    inputMode: "decimal",
                    step: 0.1 as any,
                    className: "min-h-[48px] text-base",
                    ...register("wateringAmount"),
                  }}
                  defaultUnit="ml"
                  unitOptions={[
                    { value: "ml" },
                    { value: "L" },
                    { value: "gal", label: "gal" },
                  ]}
                  onUnitChange={(value) =>
                    setValue("wateringUnit", value, { shouldDirty: true })
                  }
                />
                {errors.wateringAmount && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <p className="text-sm text-destructive font-medium">
                      {errors.wateringAmount.message}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  {t("logForm.method", { ns: "journal" })}
                </Label>
                <RadioGroup
                  onValueChange={(value: WateringMethod) => {
                    setValue("wateringMethod", value);
                    // Clear validation error when user selects
                    if (errors.wateringMethod) {
                      setValue("wateringMethod", value, {
                        shouldValidate: true,
                      });
                    }
                  }}
                  className="grid grid-cols-1 gap-3"
                >
                  {WATERING_METHOD_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-3"
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="min-w-[20px] min-h-[20px]"
                      />
                      <Label
                        htmlFor={option.value}
                        className="text-base font-normal cursor-pointer flex-1 min-h-[44px] flex items-center"
                      >
                        {t(option.label, { ns: "journal" })}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.wateringMethod && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <p className="text-sm text-destructive font-medium">
                      {errors.wateringMethod.message}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {logType === LOG_TYPES.FEEDING && (
            <>
              <div className="space-y-3">
                <Label htmlFor="feedingNpk" className="text-base font-medium">
                  {t("logForm.npk", { ns: "journal" })}
                </Label>
                <Input
                  id="feedingNpk"
                  type="text"
                  placeholder="3-1-2"
                  className="min-h-[48px] text-base"
                  onChange={(e) => setValue("feedingNpk", e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="feedingAmount"
                  className="text-base font-medium"
                >
                  {t("logForm.amount", { ns: "journal" })}
                </Label>
                <AmountWithUnit
                  inputId="feedingAmount"
                  placeholder="2.0"
                  inputProps={{
                    type: "number",
                    inputMode: "decimal",
                    step: 0.1 as any,
                    className: "min-h-[48px] text-base",
                    ...register("feedingAmount"),
                  }}
                  defaultUnit="ml/L"
                  unitOptions={[{ value: "ml/L" }, { value: "g/L" }]}
                  onUnitChange={(value) =>
                    setValue("feedingUnit", value, { shouldDirty: true })
                  }
                />
                {errors.feedingAmount && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <p className="text-sm text-destructive font-medium">
                      {errors.feedingAmount.message}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {logType === LOG_TYPES.TRAINING && (
            <div className="space-y-3">
              <Label className="text-base font-medium">
                {t("logForm.trainingMethod", { ns: "journal" })}
              </Label>
              <RadioGroup
                onValueChange={(value: TrainingMethod) => {
                  setValue("trainingMethod", value);
                  // Clear validation error when user selects
                  if (errors.trainingMethod) {
                    setValue("trainingMethod", value, { shouldValidate: true });
                  }
                }}
                className="grid grid-cols-1 gap-3"
              >
                {TRAINING_METHOD_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3"
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="min-w-[20px] min-h-[20px]"
                    />
                    <Label
                      htmlFor={option.value}
                      className="text-base font-normal cursor-pointer flex-1 min-h-[44px] flex items-center"
                    >
                      {t(option.label, { ns: "journal" })}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.trainingMethod && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="text-sm text-destructive font-medium">
                    {errors.trainingMethod.message}
                  </p>
                </div>
              )}
            </div>
          )}

          {logType === LOG_TYPES.ENVIRONMENT && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label
                    htmlFor="temperature"
                    className="text-base font-medium"
                  >
                    {t("logForm.temperature", { ns: "journal" })}
                  </Label>
                  <Input
                    id="temperature"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="24.5"
                    className="min-h-[48px] text-base"
                    {...register("temperature")}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="humidity" className="text-base font-medium">
                    {t("logForm.humidity", { ns: "journal" })}
                  </Label>
                  <Input
                    id="humidity"
                    type="number"
                    inputMode="numeric"
                    step="1"
                    placeholder="60"
                    className="min-h-[48px] text-base"
                    {...register("humidity")}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="ph" className="text-base font-medium">
                    {t("logForm.ph", { ns: "journal" })}
                  </Label>
                  <Input
                    id="ph"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="6.2"
                    className="min-h-[48px] text-base"
                    {...register("ph")}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="light" className="text-base font-medium">
                    {t("logForm.light", { ns: "journal" })}
                  </Label>
                  <Input
                    id="light"
                    type="number"
                    inputMode="numeric"
                    step="1"
                    placeholder="400"
                    className="min-h-[48px] text-base"
                    {...register("light")}
                  />
                </div>
              </div>
              {errors.temperature && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="text-sm text-destructive font-medium">
                    {errors.temperature.message}
                  </p>
                </div>
              )}
            </>
          )}

          {logType === LOG_TYPES.FLOWERING && (
            <div className="space-y-3">
              <Label htmlFor="lightSchedule" className="text-base font-medium">
                {t("logForm.lightSchedule", { ns: "journal" })}
              </Label>
              <Input
                id="lightSchedule"
                type="text"
                placeholder="12/12"
                className="min-h-[48px] text-base"
                {...register("lightSchedule")}
              />
              {errors.lightSchedule && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="text-sm text-destructive font-medium">
                    {errors.lightSchedule.message}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-medium">
              {t("logForm.notes", { ns: "journal" })}
            </Label>
            <Textarea
              id="notes"
              placeholder={t("logForm.notesPlaceholder", { ns: "journal" })}
              rows={4}
              className="text-base resize-none min-h-[120px]"
              {...register("notes")}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{watch("notes")?.length || 0}/500 characters</span>
            </div>
            {errors.notes && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {errors.notes.message}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Go back to plant page if coming from there, otherwise to journal
                if (returnTo === "plant" && urlPlantId) {
                  router.push(`/plants/${urlPlantId}`);
                } else {
                  router.push(ROUTE_JOURNAL);
                }
              }}
              className="flex-1 min-h-[48px] text-base"
              disabled={isLoading}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button
              type="submit"
              disabled={!logType || !selectedPlantId || isLoading}
              className="flex-1 min-h-[48px] text-base"
            >
              {isLoading
                ? t("saving", { ns: "common" })
                : t("logForm.save", { ns: "journal" })}
            </Button>
          </div>
        </div>
      </form>
    </Layout>
  );
}

export default function NewJournalPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <JournalFormSkeleton />
        </Layout>
      }
    >
      <NewJournalPageContent />
    </Suspense>
  );
}
