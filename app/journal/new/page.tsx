"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useTranslation } from "@/hooks/use-translation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { Layout } from "@/components/layout";
import { ArrowLeft, Calendar } from "lucide-react";
import { AnimatedLogo } from "@/components/common/animated-logo";
import { ROUTE_JOURNAL } from "@/lib/routes";

import { auth, db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query } from "firebase/firestore";
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

// Form data interface
interface LogFormData {
  logType: LogType;
  date: Date;
  notes: string;
  wateringAmount?: string;
  wateringMethod?: WateringMethod;
  feedingNpk?: string;
  feedingAmount?: string;
  trainingMethod?: TrainingMethod;
  temperature?: string;
  humidity?: string;
  ph?: string;
  light?: string;
  lightSchedule?: string;
}

function NewJournalPageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthUser();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const userId = user?.uid ?? null;

  const [isLoading, setIsLoading] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<string>("");

  // Get plant ID from URL params if provided
  const urlPlantId = searchParams.get("plantId");

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<LogFormData>({
    defaultValues: {
      logType: "" as LogType,
      date: new Date(),
      notes: "",
    },
  });

  const logType = watch("logType");
  const date = watch("date");

  // Load plants for selection
  useEffect(() => {
    const fetchPlants = async () => {
      if (!userId) return;
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
      }
    };

    if (userId) {
      fetchPlants();
    }
  }, [userId, urlPlantId]);

  const onSubmit = async (data: LogFormData) => {
    if (!auth.currentUser || !data.date || !selectedPlantId) return;

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

      toast({
        title: t("logForm.success"),
        description: t("logForm.successDesc"),
      });

      router.push(ROUTE_JOURNAL);
    } catch (error: any) {
      console.error("Error adding log:", error);
      toast({
        variant: "destructive",
        title: t("logForm.error"),
        description: error?.message || t("logForm.errorDesc"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {/* Mobile Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(ROUTE_JOURNAL)}
            className="flex items-center gap-2 min-h-[48px] px-3"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="md:inline hidden">{t("common.back")}</span>
          </Button>
        </div>
        <h1 className="text-3xl font-bold">{t("logForm.title")}</h1>
        <p className="text-muted-foreground">{t("logForm.description")}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit as any)} className="max-w-2xl">
        <div className="space-y-6">
          {/* Plant Selection */}
          {plants.length > 1 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">
                {t("logForm.plant")}
              </Label>
              <Select
                value={selectedPlantId}
                onValueChange={setSelectedPlantId}
              >
                <SelectTrigger className="min-h-[48px] text-base">
                  <SelectValue placeholder={t("logForm.selectPlant")} />
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

          {/* Log Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">{t("logForm.type")}</Label>
            <Select
              onValueChange={(value: LogType) => setValue("logType", value)}
            >
              <SelectTrigger className="min-h-[48px] text-base">
                <SelectValue placeholder={t("logForm.selectType")} />
              </SelectTrigger>
              <SelectContent>
                {LOG_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">{t("logForm.date")}</Label>
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
                    : t("logForm.selectDate")}
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
                  {t("logForm.amount")}
                </Label>
                <Input
                  id="wateringAmount"
                  type="number"
                  step="0.1"
                  placeholder="0.5"
                  className="min-h-[48px] text-base"
                  onChange={(e) => setValue("wateringAmount", e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  {t("logForm.method")}
                </Label>
                <RadioGroup
                  onValueChange={(value: WateringMethod) =>
                    setValue("wateringMethod", value)
                  }
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
                        className="text-base font-normal cursor-pointer flex-1 min-h-[48px] flex items-center"
                      >
                        {t(option.label)}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}

          {logType === LOG_TYPES.FEEDING && (
            <>
              <div className="space-y-3">
                <Label htmlFor="feedingNpk" className="text-base font-medium">
                  {t("logForm.npk")}
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
                  {t("logForm.amount")}
                </Label>
                <Input
                  id="feedingAmount"
                  type="number"
                  step="0.1"
                  placeholder="2.0"
                  className="min-h-[48px] text-base"
                  onChange={(e) => setValue("feedingAmount", e.target.value)}
                />
              </div>
            </>
          )}

          {logType === LOG_TYPES.TRAINING && (
            <div className="space-y-3">
              <Label className="text-base font-medium">
                {t("logForm.trainingMethod")}
              </Label>
              <RadioGroup
                onValueChange={(value: TrainingMethod) =>
                  setValue("trainingMethod", value)
                }
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
                      className="text-base font-normal cursor-pointer flex-1 min-h-[48px] flex items-center"
                    >
                      {t(option.label)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
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
                    {t("logForm.temperature")}
                  </Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    placeholder="24.5"
                    className="min-h-[48px] text-base"
                    onChange={(e) => setValue("temperature", e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="humidity" className="text-base font-medium">
                    {t("logForm.humidity")}
                  </Label>
                  <Input
                    id="humidity"
                    type="number"
                    step="1"
                    placeholder="60"
                    className="min-h-[48px] text-base"
                    onChange={(e) => setValue("humidity", e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="ph" className="text-base font-medium">
                    {t("logForm.ph")}
                  </Label>
                  <Input
                    id="ph"
                    type="number"
                    step="0.1"
                    placeholder="6.2"
                    className="min-h-[48px] text-base"
                    onChange={(e) => setValue("ph", e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="light" className="text-base font-medium">
                    {t("logForm.light")}
                  </Label>
                  <Input
                    id="light"
                    type="number"
                    step="1"
                    placeholder="400"
                    className="min-h-[48px] text-base"
                    onChange={(e) => setValue("light", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {logType === LOG_TYPES.FLOWERING && (
            <div className="space-y-3">
              <Label htmlFor="lightSchedule" className="text-base font-medium">
                {t("logForm.lightSchedule")}
              </Label>
              <Input
                id="lightSchedule"
                type="text"
                placeholder="12/12"
                className="min-h-[48px] text-base"
                onChange={(e) => setValue("lightSchedule", e.target.value)}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-medium">
              {t("logForm.notes")}
            </Label>
            <Textarea
              id="notes"
              placeholder={t("logForm.notesPlaceholder")}
              rows={4}
              className="text-base resize-none"
              onChange={(e) => setValue("notes", e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              type="submit"
              disabled={!logType || !selectedPlantId || isLoading}
              className="min-h-[48px] w-full sm:w-auto text-base font-medium"
            >
              {isLoading ? (
                <>
                  <AnimatedLogo size={16} className="mr-2" duration={1.2} />
                  {t("common.saving")}
                </>
              ) : (
                t("logForm.save")
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(ROUTE_JOURNAL)}
              className="min-h-[48px] w-full sm:w-auto text-base font-medium"
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      </form>
    </Layout>
  );
}

export default function NewJournalPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewJournalPageContent />
    </Suspense>
  );
}
