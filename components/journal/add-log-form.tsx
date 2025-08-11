"use client";

import type React from "react";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useErrorHandler } from "@/hooks/use-error-handler";

import { auth, db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import {
  LOG_TYPES,
  LOG_TYPE_OPTIONS,
  WATERING_METHOD_OPTIONS,
  FEEDING_TYPE_OPTIONS,
  TRAINING_METHOD_OPTIONS,
  type LogType,
  type WateringMethod,
  type TrainingMethod,
} from "@/lib/log-config";
import { buildLogsPath, buildEnvironmentPath } from "@/lib/firebase-config";
import { Loader2, Calendar } from "lucide-react";
import { formatDateObjectWithLocale } from "@/lib/utils";
import { LocalizedCalendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { LogEntry, Plant } from "@/types";
import { isValidLightSchedule } from "@/lib/plant-config";

// Form data interface
interface LogFormData {
  logType: string;
  date: Date;
  notes?: string;

  // Watering fields
  wateringAmount?: string;
  wateringMethod?: string;

  // Feeding fields
  feedingType?: string;
  feedingNpk?: string;
  feedingAmount?: string;

  // Training fields
  trainingMethod?: string;

  // Environment fields
  temperature?: string;
  humidity?: string;
  ph?: string;
  light?: string;

  // Flowering fields
  lightSchedule?: string;
}

interface AddLogFormProps {
  plantId: string;
  onSuccess?: (log: LogEntry) => void;
  showPlantSelector?: boolean;
  plants?: Plant[];
}

export function AddLogForm({
  plantId,
  onSuccess,
  showPlantSelector = false,
  plants = [],
}: AddLogFormProps) {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const { handleFirebaseError, handleValidationError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState(plantId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<LogFormData>({
    defaultValues: {
      logType: "",
      date: new Date(),
      notes: "",
    },
  });

  const logType = watch("logType");
  const date = watch("date");

  const resetForm = () => {
    reset();
  };

  const onSubmit = async (data: LogFormData) => {
    const userId = auth.currentUser?.uid;
    const currentPlantId = showPlantSelector ? selectedPlantId : plantId;

    if (!auth.currentUser || !data.date || !currentPlantId) return;

    setIsLoading(true);

    try {
      let logData: any = {
        type: data.logType,
        date: data.date.toISOString(),
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };

      // Add type-specific fields
      switch (data.logType) {
        case LOG_TYPES.WATERING:
          logData = {
            ...logData,
            amount: Number.parseFloat(data.wateringAmount || "0"),
            method: data.wateringMethod,
          };
          break;
        case LOG_TYPES.FEEDING:
          logData = {
            ...logData,
            npk: data.feedingNpk,
            amount: Number.parseFloat(data.feedingAmount || "0"),
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
            buildEnvironmentPath(auth.currentUser!.uid, currentPlantId)
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
        buildLogsPath(auth.currentUser!.uid, currentPlantId)
      );
      const docRef = await addDoc(logsRef, logData);

      toast({
        title: t("logForm.success"),
        description: t("logForm.successDesc"),
      });

      // Call success callback with new log
      if (onSuccess) {
        onSuccess({ id: docRef.id, ...logData, plantId: currentPlantId });
      }

      resetForm();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("logForm.error"),
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {showPlantSelector && plants.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="plantSelect">{t("journal.selectPlant")}</Label>
          <Select
            value={selectedPlantId}
            onValueChange={setSelectedPlantId}
            required
          >
            <SelectTrigger id="plantSelect">
              <SelectValue placeholder={t("journal.selectPlant")} />
            </SelectTrigger>
            <SelectContent>
              {plants.map((plant) => (
                <SelectItem key={plant.id} value={plant.id}>
                  {plant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="logType">{t("logForm.type")}</Label>
        <input
          type="hidden"
          {...register("logType", {
            required: t("logForm.selectType") as string,
          })}
          value={logType || ""}
        />
        <Select
          value={logType}
          onValueChange={(value) => setValue("logType", value as LogType)}
        >
          <SelectTrigger id="logType">
            <SelectValue placeholder={t("logForm.selectType")} />
          </SelectTrigger>
          <SelectContent>
            {LOG_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(`logType.${option.label}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("logForm.date")}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {date ? (
                formatDateObjectWithLocale(date, "PPP", language)
              ) : (
                <span>{t("newPlant.pickDate")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setValue("date", newDate)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Type-specific fields */}
      {logType === LOG_TYPES.WATERING && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wateringAmount">{t("watering.amount")}</Label>
            <Input
              id="wateringAmount"
              type="number"
              {...register("wateringAmount", {
                validate: (value) => {
                  if (logType !== LOG_TYPES.WATERING) return true;
                  if (!value)
                    return (t("validation.required") as string) || "Required";
                  const n = Number.parseFloat(value);
                  return (
                    (Number.isFinite(n) && n > 0) ||
                    (t("validation.numberGreaterZero") as string) ||
                    "Must be > 0"
                  );
                },
              })}
            />
            {errors.wateringAmount && (
              <p className="text-xs text-destructive">
                {String(errors.wateringAmount.message)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("watering.method")}</Label>
            <input
              type="hidden"
              {...register("wateringMethod", {
                validate: (value) =>
                  logType !== LOG_TYPES.WATERING || value
                    ? true
                    : (t("validation.required") as string) || "Required",
              })}
              value={watch("wateringMethod") || ""}
            />
            <RadioGroup
              value={watch("wateringMethod")}
              onValueChange={(value) =>
                setValue("wateringMethod", value as WateringMethod)
              }
              className="flex flex-col space-y-1"
            >
              {WATERING_METHOD_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="font-normal">
                    {t(`watering.${option.label}`)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.wateringMethod && (
              <p className="text-xs text-destructive">
                {String(errors.wateringMethod.message)}
              </p>
            )}
          </div>
        </div>
      )}

      {logType === LOG_TYPES.FEEDING && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("feeding.type")}</Label>
            <input
              type="hidden"
              {...register("feedingType", {
                validate: (value) =>
                  logType !== LOG_TYPES.FEEDING || value
                    ? true
                    : (t("validation.required") as string) || "Required",
              })}
              value={watch("feedingType") || ""}
            />
            <RadioGroup
              value={watch("feedingType")}
              onValueChange={(value) => setValue("feedingType", value)}
              className="flex flex-col space-y-1"
            >
              {FEEDING_TYPE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="font-normal">
                    {t(`feeding.${option.label}`)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.feedingType && (
              <p className="text-xs text-destructive">
                {String(errors.feedingType.message)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedingNpk">{t("feeding.npk")}</Label>
            <Input
              id="feedingNpk"
              placeholder="e.g. 20-20-20"
              {...register("feedingNpk", {
                validate: (value) =>
                  logType !== LOG_TYPES.FEEDING ||
                  (value && value.trim().length > 0)
                    ? true
                    : (t("validation.required") as string) || "Required",
              })}
            />
            {errors.feedingNpk && (
              <p className="text-xs text-destructive">
                {String(errors.feedingNpk.message)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedingAmount">{t("feeding.amount")}</Label>
            <Input
              id="feedingAmount"
              type="number"
              {...register("feedingAmount", {
                validate: (value) => {
                  if (logType !== LOG_TYPES.FEEDING) return true;
                  if (!value)
                    return (t("validation.required") as string) || "Required";
                  const n = Number.parseFloat(value);
                  return (
                    (Number.isFinite(n) && n > 0) ||
                    (t("validation.numberGreaterZero") as string) ||
                    "Must be > 0"
                  );
                },
              })}
            />
            {errors.feedingAmount && (
              <p className="text-xs text-destructive">
                {String(errors.feedingAmount.message)}
              </p>
            )}
          </div>
        </div>
      )}

      {logType === LOG_TYPES.TRAINING && (
        <div className="space-y-2">
          <Label>{t("training.method")}</Label>
          <input
            type="hidden"
            {...register("trainingMethod", {
              validate: (value) =>
                logType !== LOG_TYPES.TRAINING || value
                  ? true
                  : (t("validation.required") as string) || "Required",
            })}
            value={watch("trainingMethod") || ""}
          />
          <RadioGroup
            value={watch("trainingMethod")}
            onValueChange={(value) =>
              setValue("trainingMethod", value as TrainingMethod)
            }
            className="flex flex-col space-y-1"
          >
            {TRAINING_METHOD_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="font-normal">
                  {t(`training.${option.label}`)}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.trainingMethod && (
            <p className="text-xs text-destructive">
              {String(errors.trainingMethod.message)}
            </p>
          )}
        </div>
      )}

      {logType === LOG_TYPES.ENVIRONMENT && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="temperature">{t("environment.temperature")}</Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              {...register("temperature", {
                validate: (value) =>
                  logType !== LOG_TYPES.ENVIRONMENT || (value && value !== "")
                    ? true
                    : (t("validation.required") as string) || "Required",
              })}
            />
            {errors.temperature && (
              <p className="text-xs text-destructive">
                {String(errors.temperature.message)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="humidity">{t("environment.humidity")}</Label>
            <Input
              id="humidity"
              type="number"
              step="0.1"
              {...register("humidity", {
                validate: (value) =>
                  logType !== LOG_TYPES.ENVIRONMENT || (value && value !== "")
                    ? true
                    : (t("validation.required") as string) || "Required",
              })}
            />
            {errors.humidity && (
              <p className="text-xs text-destructive">
                {String(errors.humidity.message)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ph">{t("environment.ph")}</Label>
            <Input
              id="ph"
              type="number"
              step="0.1"
              {...register("ph", {
                validate: (value) =>
                  logType !== LOG_TYPES.ENVIRONMENT || (value && value !== "")
                    ? true
                    : (t("validation.required") as string) || "Required",
              })}
            />
            {errors.ph && (
              <p className="text-xs text-destructive">
                {String(errors.ph.message)}
              </p>
            )}
          </div>
        </div>
      )}

      {logType === LOG_TYPES.FLOWERING && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lightSchedule">{t("newPlant.lightSchedule")}</Label>
            <Input
              id="lightSchedule"
              placeholder={t("newPlant.lightSchedulePlaceholder")}
              {...register("lightSchedule", {
                validate: (value) => {
                  if (logType !== LOG_TYPES.FLOWERING) return true;
                  if (!value || !value.trim())
                    return (t("validation.required") as string) || "Required";
                  const ok = isValidLightSchedule(value.trim());
                  return ok || (t("validation.invalidLightSchedule") as string);
                },
              })}
            />
            {errors.lightSchedule && (
              <p className="text-xs text-destructive">
                {String(errors.lightSchedule.message)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">{t("logForm.notes")}</Label>
        <Textarea id="notes" rows={3} {...register("notes")} />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !logType}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("logForm.loading")}
          </>
        ) : (
          t("logForm.submit")
        )}
      </Button>
    </form>
  );
}
