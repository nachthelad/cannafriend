"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Calendar } from "lucide-react";
import { ROUTE_DASHBOARD, ROUTE_JOURNAL } from "@/lib/routes";
import { Skeleton } from "@/components/ui/skeleton";

import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  writeBatch,
  doc,
} from "firebase/firestore";
import {
  invalidateDashboardCache,
  invalidateJournalCache,
  invalidatePlantsCache,
  invalidatePlantDetails,
  optimisticAddLog,
} from "@/lib/suspense-cache";
import {
  LOG_TYPES,
  LOG_TYPE_OPTIONS,
  WATERING_METHODS,
  WATERING_METHOD_OPTIONS,
  TRAINING_METHODS,
  TRAINING_METHOD_OPTIONS,
  type LogType,
} from "@/lib/log-config";
import { buildLogsPath, buildEnvironmentPath } from "@/lib/firebase-config";
import { plantDoc, plantsCol } from "@/lib/paths";
import { formatDateObjectWithLocale } from "@/lib/utils";
import { LocalizedCalendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Plant } from "@/types";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { PLANT_STATUS } from "@/lib/plant-config";
import { isPlantGrowing, normalizePlant } from "@/lib/plant-utils";
import { MultiPlantSelector } from "@/components/plant/multi-plant-selector";
import { DataErrorBoundary } from "@/components/common/data-error-boundary";
import { WorkbenchSurface } from "@/components/common/desktop-form-workbench";
import { toast } from "sonner";

function JournalFormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}

type MethodOption = {
  value: string;
  label: string;
};

function SelectionChips({
  options,
  value,
  onChange,
  getLabel,
}: {
  options: readonly MethodOption[];
  value?: string;
  onChange: (value: string) => void;
  getLabel: (label: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <Button
            key={option.value}
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className="h-9 rounded-full px-4"
            onClick={() => onChange(option.value)}
          >
            {getLabel(option.label)}
          </Button>
        );
      })}
    </div>
  );
}

// Zod schema for individual plant log data
const createPerPlantSchema = (t: any) =>
  z.object({
    // Watering / Feeding
    amount: z.string().optional(),
    unit: z.string().optional(),
    method: z.string().optional(),
    npk: z.string().optional(),
    // Notes
    note: z.string().optional(),
    // Training
    trainingMethod: z.string().optional(),
    // Environment - usually global but sticking to per-plant structure for flexibility
    temperature: z.string().optional(),
    humidity: z.string().optional(),
    ph: z.string().optional(),
    light: z.string().optional(),
    // Flowering
    lightSchedule: z.string().optional(),
  });

const createFormSchema = (t: any) =>
  z
    .object({
      logType: z.string().min(1, t("logTypeRequired", { ns: "validation" })),
      date: z.date(),
      selectedPlantIds: z
        .array(z.string())
        .min(1, t("selectAtLeastOnePlant", { ns: "validation" })),

      // Global/Default values
      globalNote: z.string().optional(),
      globalAmount: z.string().optional(), // Helper to fill all
      globalUnit: z.string().optional(),

      // Toggles
      customizeNotes: z.boolean().optional(),

      // Per-plant data
      plantLogs: z.record(z.string(), createPerPlantSchema(t)),
    })
    .superRefine((data, ctx) => {
      // Validate each selected plant based on log type
      data.selectedPlantIds.forEach((plantId) => {
        const plantLog = data.plantLogs[plantId];
        if (!plantLog) return; // Should not happen if initialized correctly

        // Watering Validation
        if (data.logType === LOG_TYPES.WATERING) {
          if (!plantLog.amount || parseFloat(plantLog.amount) <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("waterAmountRequired", { ns: "validation" }),
              path: ["plantLogs", plantId, "amount"],
            });
          }
          if (!plantLog.method) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("waterMethodRequired", { ns: "validation" }),
              path: ["plantLogs", plantId, "method"],
            });
          }
        }

        // Feeding Validation
        if (data.logType === LOG_TYPES.FEEDING) {
          if (!plantLog.amount || parseFloat(plantLog.amount) <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("nutrientAmountRequired", { ns: "validation" }),
              path: ["plantLogs", plantId, "amount"],
            });
          }
        }

        // Note Validation (if custom notes enabled)
        if (data.logType === LOG_TYPES.NOTE && data.customizeNotes) {
          if (!plantLog.note?.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("notesRequired", { ns: "validation" }),
              path: ["plantLogs", plantId, "note"],
            });
          }
        }

        // Training Validation
        if (data.logType === LOG_TYPES.TRAINING) {
          if (!plantLog.trainingMethod) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("trainingMethodRequired", { ns: "validation" }),
              path: ["plantLogs", plantId, "trainingMethod"],
            });
          }
        }

        // Flowering Validation
        if (data.logType === LOG_TYPES.FLOWERING) {
          if (!plantLog.lightSchedule?.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("lightScheduleRequired", { ns: "validation" }),
              path: ["plantLogs", plantId, "lightSchedule"],
            });
          }
        }

        // Environment Validation
        if (data.logType === LOG_TYPES.ENVIRONMENT) {
          const hasData =
            (plantLog.temperature && parseFloat(plantLog.temperature) > 0) ||
            (plantLog.humidity && parseFloat(plantLog.humidity) > 0) ||
            (plantLog.ph && parseFloat(plantLog.ph) > 0) ||
            (plantLog.light && parseFloat(plantLog.light) > 0);

          if (!hasData) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("environmentValueRequired", { ns: "validation" }),
              path: ["plantLogs", plantId, "temperature"], // Pointing to first field
            });
          }
        }
      });

      // Global Note Validation (if custom notes disabled)
      if (data.logType === LOG_TYPES.NOTE && !data.customizeNotes) {
        if (!data.globalNote?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("notesRequired", { ns: "validation" }),
            path: ["globalNote"],
          });
        }
      }
    });

type LogFormData = z.infer<ReturnType<typeof createFormSchema>>;

function NewJournalPageContent() {
  const { t } = useTranslation(["journal", "common", "validation", "plants"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthUser();
  const userId = user?.uid ?? null;

  const [isLoading, setIsLoading] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [plantsLoading, setPlantsLoading] = useState<boolean>(true);

  // URL Params
  const urlPlantId = searchParams.get("plantId");
  const returnTo = searchParams.get("returnTo");

  // Schema
  const formSchema = useMemo(() => createFormSchema(t), [t]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<LogFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      logType: "" as LogType,
      date: new Date(),
      selectedPlantIds: [],
      customizeNotes: false,
      plantLogs: {},
      globalUnit: "ml",
    },
  });

  const logType = watch("logType");
  const date = watch("date");
  const selectedPlantIds = watch("selectedPlantIds");
  const customizeNotes = watch("customizeNotes");

  // Fetch plants
  useEffect(() => {
    const fetchPlants = async () => {
      if (!userId) {
        setPlantsLoading(false);
        return;
      }
      try {
        const q = query(plantsCol(userId));
        const snapshot = await getDocs(q);
        const plantsData = snapshot.docs
          .map((doc) => normalizePlant(doc.data(), doc.id))
          .filter(isPlantGrowing);
        setPlants(plantsData);

        // Initialize selection
        if (urlPlantId && plantsData.find((p) => p.id === urlPlantId)) {
          setValue("selectedPlantIds", [urlPlantId]);
        } else if (plantsData.length > 0 && selectedPlantIds.length === 0) {
          setValue("selectedPlantIds", [plantsData[0].id]);
        }
      } catch (error) {
        console.error("Error fetching plants:", error);
      } finally {
        setPlantsLoading(false);
      }
    };
    if (userId) fetchPlants();
  }, [userId, urlPlantId, setValue]);

  // Initialize plant logs when selection changes
  useEffect(() => {
    const currentLogs = getValues("plantLogs") || {};
    const newLogs = { ...currentLogs };

    selectedPlantIds.forEach((id) => {
      if (!newLogs[id]) {
        newLogs[id] = {
          amount: "",
          unit: "ml",
          note: "",
          method: WATERING_METHODS.TOP_WATERING,
          trainingMethod: TRAINING_METHODS.TOPPING,
          npk: "",
          temperature: "",
          humidity: "",
          ph: "",
          light: "",
          lightSchedule: "",
        };
      } else {
        newLogs[id] = {
          ...newLogs[id],
          method: newLogs[id].method || WATERING_METHODS.TOP_WATERING,
          trainingMethod:
            newLogs[id].trainingMethod || TRAINING_METHODS.TOPPING,
        };
      }
    });

    setValue("plantLogs", newLogs);
  }, [selectedPlantIds, setValue]);

  const onSubmit = async (data: LogFormData) => {
    if (!auth.currentUser || !data.date || data.selectedPlantIds.length === 0)
      return;
    setIsLoading(true);

    try {
      const batch = writeBatch(db);

      const promises = data.selectedPlantIds.map(async (plantId) => {
        const plantSpecific = data.plantLogs[plantId];

        let logData: any = {
          type: data.logType,
          date: data.date.toISOString(),
          createdAt: new Date().toISOString(),
          userId: auth.currentUser!.uid,
          plantId: plantId,
          // Notes logic: usage global unless customized
          notes: data.customizeNotes ? plantSpecific.note : data.globalNote,
        };

        // Attach plant name for optimistic display
        const plant = plants.find((p) => p.id === plantId);
        if (plant) logData.plantName = plant.name;

        switch (data.logType) {
          case LOG_TYPES.WATERING:
            logData.amount = parseFloat(plantSpecific.amount || "0");
            logData.unit = plantSpecific.unit || "ml";
            if (plantSpecific.method) logData.method = plantSpecific.method;
            break;
          case LOG_TYPES.FEEDING:
            logData.amount = parseFloat(plantSpecific.amount || "0");
            logData.unit = plantSpecific.unit || "ml/L";
            if (plantSpecific.npk) logData.npk = plantSpecific.npk;
            break;
          case LOG_TYPES.TRAINING:
            if (plantSpecific.trainingMethod)
              logData.method = plantSpecific.trainingMethod;
            break;
          case LOG_TYPES.ENVIRONMENT:
            logData.temperature = parseFloat(plantSpecific.temperature || "0");
            logData.humidity = parseFloat(plantSpecific.humidity || "0");
            logData.ph = parseFloat(plantSpecific.ph || "0");
            logData.light = parseFloat(plantSpecific.light || "0");

            // Also save to environment collection for charts
            const envRef = collection(
              db,
              buildEnvironmentPath(auth.currentUser!.uid, plantId)
            );
            await addDoc(envRef, {
              date: data.date.toISOString(),
              temperature: logData.temperature,
              humidity: logData.humidity,
              ph: logData.ph,
              createdAt: new Date().toISOString(),
            });
            break;
          case LOG_TYPES.FLOWERING:
            if (plantSpecific.lightSchedule)
              logData.lightSchedule = plantSpecific.lightSchedule;
            break;
          case LOG_TYPES.END_CYCLE:
            logData.status = PLANT_STATUS.ENDED;
            const plantRef = plantDoc(auth.currentUser!.uid, plantId);
            batch.update(plantRef, {
              status: PLANT_STATUS.ENDED,
              endedAt: data.date.toISOString(),
            });
            break;
        }

        const newLogRef = doc(
          collection(db, buildLogsPath(auth.currentUser!.uid, plantId))
        );
        batch.set(newLogRef, logData);

        // Invalidations
        invalidatePlantDetails(auth.currentUser!.uid, plantId);

        return { id: newLogRef.id, ...logData } as any;
      });

      const builtLogs = await Promise.all(promises);
      await batch.commit();

      // Optimistically prepend each new log to journal caches
      for (const log of builtLogs) {
        optimisticAddLog(auth.currentUser!.uid, log);
      }

      invalidateJournalCache(auth.currentUser!.uid);
      invalidatePlantsCache(auth.currentUser!.uid);
      invalidateDashboardCache(auth.currentUser!.uid);

      if (returnTo === "plant" && urlPlantId) {
        router.push(`/plants/${urlPlantId}`);
      } else if (returnTo === "dashboard") {
        router.push(ROUTE_DASHBOARD);
      } else {
        router.push(ROUTE_JOURNAL);
      }
    } catch (error: any) {
      console.error("Error adding logs:", error);
      toast.error(t("toast.saveError", { ns: "journal" }));
    } finally {
      setIsLoading(false);
    }
  };

  if (plantsLoading) {
    return <JournalFormSkeleton />;
  }

  return (
    <>
      <ResponsivePageHeader
        title={t("logForm.title", { ns: "journal" })}
        description={t("logForm.description", { ns: "journal" })}
        onBackClick={() => router.back()}
      />

      <form
        onSubmit={handleSubmit(onSubmit as any, (errors) => {
          console.error("Form validation errors:", errors);
        })}
        className="mx-auto max-w-5xl px-4 pb-8 md:px-6"
      >
        <WorkbenchSurface className="space-y-6 xl:bg-card/80">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>{t("logForm.plant", { ns: "journal" })}</Label>
            </div>

            <div className="xl:hidden">
              <Controller
                control={control}
                name="selectedPlantIds"
                render={({ field }) => (
                  <MultiPlantSelector
                    plants={plants}
                    selectedPlantIds={field.value || []}
                    onSelectionChange={(ids) =>
                      setValue("selectedPlantIds", ids, {
                        shouldValidate: !!errors.selectedPlantIds,
                      })
                    }
                  />
                )}
              />
            </div>

            <div className="hidden xl:block">
              <Controller
                control={control}
                name="selectedPlantIds"
                render={({ field }) => (
                  <MultiPlantSelector
                    plants={plants}
                    selectedPlantIds={field.value || []}
                    onSelectionChange={(ids) =>
                      setValue("selectedPlantIds", ids, {
                        shouldValidate: !!errors.selectedPlantIds,
                      })
                    }
                    variant="desktop-grid"
                  />
                )}
              />
            </div>

            {errors.selectedPlantIds && (
              <p className="text-sm text-destructive">
                {errors.selectedPlantIds.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-border/60 pt-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("logForm.type", { ns: "journal" })}</Label>
              <Select
                onValueChange={(val) =>
                  setValue("logType", val as LogType, {
                    shouldValidate: true,
                  })
                }
                value={logType}
                disabled={selectedPlantIds.length === 0}
              >
                <SelectTrigger className="min-h-[52px] rounded-2xl xl:bg-background/70">
                  <SelectValue
                    placeholder={t("logForm.selectType", { ns: "journal" })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {LOG_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.label, { ns: "journal" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.logType && selectedPlantIds.length > 0 && (
                <p className="text-sm text-destructive">
                  {errors.logType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("logForm.date", { ns: "journal" })}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "min-h-[52px] w-full justify-start rounded-2xl text-left font-normal xl:bg-background/70",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {date
                        ? formatDateObjectWithLocale(date)
                        : t("logForm.selectDate", { ns: "journal" })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setValue("date", d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {logType && selectedPlantIds.length > 0 && (
            <div className="space-y-6 border-t border-border/60 pt-6">
              {/* Per-Plant Inputs Section */}
              {(logType === LOG_TYPES.WATERING ||
                logType === LOG_TYPES.FEEDING) && (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {selectedPlantIds.map((plantId) => {
                      const plant = plants.find((p) => p.id === plantId);
                      if (!plant) return null;
                      return (
                        <div
                          key={plantId}
                          className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 xl:bg-background/55"
                        >
                          <div className="flex items-end gap-3">
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs text-muted-foreground truncate block">
                                {plant.name}
                              </Label>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex-1">
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      step="0.1"
                                      placeholder="0.0"
                                      {...register(
                                        `plantLogs.${plantId}.amount`
                                      )}
                                      className={cn(
                                        "min-h-[48px] rounded-2xl pr-8 xl:bg-background/70",
                                        errors.plantLogs?.[plantId]?.amount &&
                                          "border-destructive"
                                      )}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                      <span className="text-sm text-muted-foreground">
                                        ml
                                      </span>
                                    </div>
                                  </div>
                                  {errors.plantLogs?.[plantId]?.amount && (
                                    <p className="text-xs text-destructive mt-1">
                                      {
                                        errors.plantLogs[plantId]?.amount
                                          ?.message
                                      }
                                    </p>
                                  )}
                                </div>

                                {/* NPK for Feeding */}
                                {logType === LOG_TYPES.FEEDING && (
                                  <div className="w-full sm:w-[180px]">
                                    <Input
                                      placeholder={t("logForm.npkPlaceholder", {
                                        ns: "journal",
                                      })}
                                      className="min-h-[48px] rounded-2xl xl:bg-background/70"
                                      {...register(`plantLogs.${plantId}.npk`)}
                                    />
                                  </div>
                                )}
                              </div>

                              {logType === LOG_TYPES.WATERING && (
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">
                                    {t("logForm.method", { ns: "journal" })}
                                  </Label>
                                  <Controller
                                    control={control}
                                    name={`plantLogs.${plantId}.method`}
                                    render={({ field }) => (
                                      <SelectionChips
                                        options={WATERING_METHOD_OPTIONS}
                                        value={
                                          field.value ||
                                          WATERING_METHODS.TOP_WATERING
                                        }
                                        onChange={(value) => {
                                          field.onChange(value);
                                          setValue(
                                            `plantLogs.${plantId}.method`,
                                            value,
                                            {
                                              shouldValidate: true,
                                            }
                                          );
                                        }}
                                        getLabel={(label) =>
                                          t(label, { ns: "journal" })
                                        }
                                      />
                                    )}
                                  />
                                  {errors.plantLogs?.[plantId]?.method && (
                                    <p className="text-xs text-destructive">
                                      {
                                        errors.plantLogs[plantId]?.method
                                          ?.message
                                      }
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Training Section */}
              {logType === LOG_TYPES.TRAINING && (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {selectedPlantIds.map((plantId) => {
                      const plant = plants.find((p) => p.id === plantId);
                      if (!plant) return null;
                      return (
                        <div
                          key={plantId}
                          className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4 xl:bg-background/55"
                        >
                          <Label className="text-sm font-medium">
                            {plant.name}
                          </Label>
                          <Controller
                            control={control}
                            name={`plantLogs.${plantId}.trainingMethod`}
                            render={({ field }) => (
                              <SelectionChips
                                options={TRAINING_METHOD_OPTIONS}
                                value={
                                  field.value || TRAINING_METHODS.TOPPING
                                }
                                onChange={(value) => {
                                  field.onChange(value);
                                  setValue(
                                    `plantLogs.${plantId}.trainingMethod`,
                                    value,
                                    {
                                      shouldValidate: true,
                                    }
                                  );
                                }}
                                getLabel={(label) =>
                                  t(label, { ns: "journal" })
                                }
                              />
                            )}
                          />
                          {errors.plantLogs?.[plantId]?.trainingMethod && (
                            <p className="text-xs text-destructive mt-1">
                              {
                                errors.plantLogs[plantId]?.trainingMethod
                                  ?.message
                              }
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Environment Section */}
              {logType === LOG_TYPES.ENVIRONMENT && (
                <div className="space-y-4">
                  {/* Note: Environment usually is shared, but we allow per-plant entry if needed. 
                        For now, let's provide a global input that fills all, similar to amount.
                    */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        {t("logForm.temperature", { ns: "journal" })}
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="24.0"
                        className="min-h-[48px] rounded-2xl xl:bg-background/70"
                        onChange={(e) => {
                          const val = e.target.value;
                          selectedPlantIds.forEach((id) =>
                            setValue(`plantLogs.${id}.temperature`, val)
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("logForm.humidity", { ns: "journal" })}</Label>
                      <Input
                        type="number"
                        step="1"
                        placeholder="60"
                        className="min-h-[48px] rounded-2xl xl:bg-background/70"
                        onChange={(e) => {
                          const val = e.target.value;
                          selectedPlantIds.forEach((id) =>
                            setValue(`plantLogs.${id}.humidity`, val)
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("logForm.ph", { ns: "journal" })}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="6.2"
                        className="min-h-[48px] rounded-2xl xl:bg-background/70"
                        onChange={(e) => {
                          const val = e.target.value;
                          selectedPlantIds.forEach((id) =>
                            setValue(`plantLogs.${id}.ph`, val)
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("logForm.light", { ns: "journal" })}</Label>
                      <Input
                        type="number"
                        step="1"
                        placeholder="400"
                        className="min-h-[48px] rounded-2xl xl:bg-background/70"
                        onChange={(e) => {
                          const val = e.target.value;
                          selectedPlantIds.forEach((id) =>
                            setValue(`plantLogs.${id}.light`, val)
                          );
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {t("logForm.environmentNote", { ns: "journal" })}
                  </p>
                  {selectedPlantIds.map((id) => (
                    <div key={id}>
                      {errors.plantLogs?.[id]?.temperature && (
                        <p className="text-sm text-destructive text-center">
                          {errors.plantLogs[id]?.temperature?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Flowering Section */}
              {logType === LOG_TYPES.FLOWERING && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      {t("logForm.lightSchedule", { ns: "journal" })}
                    </Label>
                    <Input
                      placeholder="12/12"
                      className="min-h-[48px] rounded-2xl xl:bg-background/70"
                      onChange={(e) => {
                        const val = e.target.value;
                        selectedPlantIds.forEach((id) =>
                          setValue(`plantLogs.${id}.lightSchedule`, val)
                        );
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("logForm.floweringNote", { ns: "journal" })}
                    </p>
                    {selectedPlantIds.map((id) => (
                      <div key={id}>
                        {errors.plantLogs?.[id]?.lightSchedule && (
                          <p className="text-sm text-destructive">
                            {errors.plantLogs[id]?.lightSchedule?.message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generic Per-Plant Note Section for other types (Transplant, Environment, Flowering, End Cycle, etc) 
                  If customization is on, and we haven't already rendered a per-plant section with notes (like Watering/Note/Training).
                  Actually, Environment and Flowering have their own sections above, but they are Global inputs. 
                  If we want per-plant notes for them, we need to render the loop.
              */}
              {/* Unified Notes Section (Bottom) */}
                <div
                  className={cn(
                    "space-y-4",
                    logType !== LOG_TYPES.TRANSPLANT &&
                      logType !== LOG_TYPES.END_CYCLE &&
                      logType !== LOG_TYPES.NOTE &&
                      "mt-4 border-t pt-4 xl:mt-2"
                  )}
                >
                <div className="flex items-center justify-between">
                  <Label>{t("logForm.notes", { ns: "journal" })}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {t("logForm.customizePerPlant", { ns: "journal" })}
                    </span>
                    <Controller
                      control={control}
                      name="customizeNotes"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>

                {!customizeNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder={t("logForm.notesPlaceholder", {
                        ns: "journal",
                      })}
                      className="min-h-[120px] rounded-2xl xl:bg-background/70"
                      {...register("globalNote")}
                    />
                    {errors.globalNote && (
                      <p className="text-sm text-destructive">
                        {errors.globalNote.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {selectedPlantIds.map((plantId) => {
                      const plant = plants.find((p) => p.id === plantId);
                      if (!plant) return null;
                      return (
                        <div
                          key={plantId}
                          className="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-4 xl:bg-background/55"
                        >
                          <Label className="text-sm font-medium">
                            {plant.name}
                          </Label>
                          <Textarea
                            placeholder={t("logForm.notePlaceholder", {
                              ns: "journal",
                            })}
                            {...register(`plantLogs.${plantId}.note`)}
                            className="h-24 resize-none rounded-2xl xl:bg-background/70"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </WorkbenchSurface>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-h-[48px] rounded-2xl sm:min-w-[160px]"
            onClick={() => router.back()}
          >
            {t("cancel", { ns: "common" })}
          </Button>
          <Button
            type="submit"
            className="min-h-[48px] rounded-2xl px-8 sm:min-w-[220px]"
            size="lg"
            disabled={isLoading}
          >
            {isLoading
              ? t("saving", { ns: "common" })
              : t("logForm.save", { ns: "journal" })}
          </Button>
        </div>
      </form>
    </>
  );
}

export default function NewJournalPage() {
  return (
    <DataErrorBoundary>
      <Suspense
        fallback={
          <JournalFormSkeleton />
        }
      >
        <NewJournalPageContent />
      </Suspense>
    </DataErrorBoundary>
  );
}
